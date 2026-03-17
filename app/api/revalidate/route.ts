import { revalidateTag, revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand revalidation API endpoint
 *
 * This endpoint is called by WordPress webhooks to trigger cache revalidation
 * when content is updated.
 *
 * Expected payload from WordPress:
 * {
 *   "postId": 123,
 *   "slug": "my-post",
 *   "surrogate_keys": ["post-123", "post-my-post", "post-list", "term-5"],
 *   "secret": "xxx"
 * }
 */
export async function POST(request: NextRequest) {
  // Try to get secret from multiple sources
  let secret = request.nextUrl.searchParams.get('secret') ||
                request.headers.get('X-Webhook-Secret') ||
                null;

  // Debug logging
  console.log('[Revalidate] Request received at:', new Date().toISOString());
  console.log('[Revalidate] Secret from query:', request.nextUrl.searchParams.get('secret') ? 'Found' : 'MISSING');
  console.log('[Revalidate] Secret from header:', request.headers.get('X-Webhook-Secret') ? 'Found' : 'MISSING');
  console.log('[Revalidate] Expected secret defined:', !!process.env.WORDPRESS_REVALIDATE_SECRET);

  // Validate origin header (optional security enhancement)
  const origin = request.headers.get('origin') || request.headers.get('referer');
  if (origin && process.env.WORDPRESS_API_URL) {
    const allowedOrigin = new URL(process.env.WORDPRESS_API_URL).origin;
    if (!origin.startsWith(allowedOrigin)) {
      console.warn(`[Revalidate] Rejected request from unauthorized origin: ${origin}`);
    }
  }

  // Parse request body
  let body: {
    postId?: number;
    slug?: string;
    surrogate_keys?: string[];
    secret?: string;
    path?: string;
    tag?: string;
    invalidation?: { tags?: string[]; paths?: string[] };
  } = {};

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();

      // If secret is in body, use it (WordPress webhook pattern)
      if (body.secret && !secret) {
        secret = body.secret;
      }
    }
  } catch (error) {
    console.log('[Revalidate] Body parsing failed:', error);
  }

  // Verify secret token from any source
  if (secret !== process.env.WORDPRESS_REVALIDATE_SECRET) {
    console.log('[Revalidate] 401 - Secret mismatch or undefined');
    return NextResponse.json(
      { message: 'Invalid secret token' },
      { status: 401 }
    );
  }

  console.log('[Revalidate] Secret validated successfully');

  try {
    const { path, tag, invalidation, surrogate_keys } = body;

    // Check query params for path (compatibility with existing WordPress plugin)
    const pathFromQuery = request.nextUrl.searchParams.get('path');

    // WordPress webhook format: surrogate_keys array
    if (surrogate_keys && Array.isArray(surrogate_keys)) {
      if (surrogate_keys.length === 0) {
        return NextResponse.json(
          { error: 'surrogate_keys array is empty' },
          { status: 400 }
        );
      }

      const results = [];
      for (const key of surrogate_keys) {
        try {
          revalidateTag(key, { expire: 0 });
          results.push({ key, status: 'success' });
        } catch (error) {
          results.push({ key, status: 'error', message: String(error) });
        }
      }

      // Homepage cache workaround. The cache handler's tagsMapping never
      // associates the /index route cache entry with homepage tags, so
      // revalidateTag() never deletes it. Delete it from GCS directly,
      // then clear the edge cache for / (CDN stores homepage under /,
      // not /index).
      if (surrogate_keys.includes('front-page')) {
        revalidatePath('/');

        // Delete route cache entry from GCS so Next.js does a fresh render
        // instead of serving stale content via SWR.
        const bucket = process.env.CACHE_BUCKET;
        if (bucket) {
          try {
            const tokenResp = await fetch(
              'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
              { headers: { 'Metadata-Flavor': 'Google' }, cache: 'no-store' }
            );
            const { access_token } = await tokenResp.json();
            const object = encodeURIComponent('route-cache/_index.json');
            const gcsResp = await fetch(
              `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${object}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${access_token}` },
              }
            );
            console.log(`[Revalidate] GCS route cache /index deleted: HTTP ${gcsResp.status}`);
          } catch (e) {
            console.warn('[Revalidate] GCS route cache /index delete failed:', e);
          }
        }

        // Clear edge cache for / (CDN stores homepage under /, not /index).
        if (process.env.OUTBOUND_PROXY_ENDPOINT) {
          try {
            const edgeUrl = `http://${process.env.OUTBOUND_PROXY_ENDPOINT}/rest/v0alpha1/cache/paths/%252F`;
            const edgeResp = await fetch(edgeUrl, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            });
            console.log(`[Revalidate] Edge cache cleared for /: HTTP ${edgeResp.status}`);
          } catch (e) {
            console.warn('[Revalidate] Edge cache clear for / failed:', e);
          }
        }
      }

      console.log(`[Revalidate] Revalidated ${surrogate_keys.length} tags from WordPress webhook`);

      return NextResponse.json({
        message: `Revalidated ${surrogate_keys.length} cache tags`,
        revalidated_at: new Date().toISOString(),
        results,
      }, {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        }
      });
    }

    // New format: invalidation object with arrays
    if (invalidation) {
      const { tags, paths } = invalidation;

      if (!tags?.length && !paths?.length) {
        return NextResponse.json(
          { message: 'Missing tags or paths in invalidation object' },
          { status: 400 }
        );
      }

      const results: { tags: string[]; paths: string[] } = { tags: [], paths: [] };

      // Process tag array
      if (tags && Array.isArray(tags)) {
        for (const t of tags) {
          revalidateTag(t, 'max');
          results.tags.push(t);
          console.log(`[Revalidate] Tag revalidated: ${t}`);
        }
      }

      // Process path array
      if (paths && Array.isArray(paths)) {
        for (const p of paths) {
          await revalidatePath(p);
          results.paths.push(p);
          console.log(`[Revalidate] Path revalidated: ${p}`);
        }
      }

      console.log(`[Revalidate] Webhook received at ${new Date().toISOString()}`);

      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        results,
      });
    }

    // Legacy format: single path or tag (backward compatibility)
    // Support path from both body and query params (existing WP plugin sends via query)
    const pathToRevalidate = path || pathFromQuery;

    if (pathToRevalidate) {
      await revalidatePath(pathToRevalidate);
      console.log(`[Revalidate] Path revalidated: ${pathToRevalidate}`);
    }

    if (tag) {
      revalidateTag(tag, 'max');
      console.log(`[Revalidate] Tag revalidated: ${tag}`);
    }

    if (!pathToRevalidate && !tag) {
      return NextResponse.json(
        { message: 'Missing path or tag parameter' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      path: pathToRevalidate || null,
      tag: tag || null,
    });
  } catch (err) {
    console.error('[Revalidate] Error:', err);
    return NextResponse.json(
      {
        message: 'Error revalidating',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET method for testing the endpoint
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  if (secret !== process.env.WORDPRESS_REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: 'Invalid secret token' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: 'Revalidation endpoint is working',
    usage: 'Send POST request with { surrogate_keys: ["post-123", "post-list"] } in body',
    expected_secret: 'WORDPRESS_REVALIDATE_SECRET environment variable',
  });
}
