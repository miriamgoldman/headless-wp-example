# Homepage Cache Invalidation Bug

## Summary

Tag-based cache revalidation works correctly for all routes (`/blog`, `/sample-page/`, etc.) except the homepage (`/`). After a WordPress content update and webhook-triggered revalidation, the homepage continues serving stale content indefinitely.

## Root Cause

Bug in `@pantheon-systems/nextjs-cache-handler` — the `cacheKeyToRoutePath` function does not map Next.js's homepage cache key `/index` to the actual URL path `/`.

**File:** `node_modules/@pantheon-systems/nextjs-cache-handler/dist/handlers/gcs.js`, line 228

```javascript
cacheKeyToRoutePath(cacheKey) {
    if (cacheKey.startsWith('/')) {
        return cacheKey;  // '/index' → '/index' (WRONG — should be '/')
    }
    if (cacheKey.startsWith('_')) {
        return cacheKey.replace(/_/g, '/');
    }
    return `/${cacheKey}`;
}
```

## How It Works (and Breaks)

The `@pantheon-systems/nextjs-cache-handler` package has internal edge cache clearing logic that runs automatically after every route cache update. This is what makes tag-based invalidation work end-to-end on Pantheon.

### The flow for `/blog` (works):

1. WordPress webhook fires → `revalidateTag('post-list', { expire: 0 })` called
2. GcsCacheHandler deletes fetch cache entries tagged with `post-list`
3. `tagsManifest` updated — Next.js knows routes using `post-list` are stale
4. Next request for `/blog` → route cache HIT (stale), stale content served, background re-render starts
5. Background re-render: `getRecentPosts()` use-cache entry re-executes, fresh data fetched
6. Route SET: `GcsCacheHandler.set('/blog', ...)` stores fresh content in GCS
7. **`onRouteCacheSet('/blog')` fires** → `cacheKeyToRoutePath('/blog')` → `/blog` → edge cache cleared for `/blog`
8. Next request: edge cache MISS, Next.js serves fresh content from GCS → **user sees update**

### The flow for `/` (broken):

Steps 1-6 identical, but with homepage tags (`page-70`, `front-page`, etc.) and cache key `/index`.

7. **`onRouteCacheSet('/index')` fires** → `cacheKeyToRoutePath('/index')` → `/index` → edge cache cleared for `/index`
8. But the edge cache has the homepage stored under path `/`, NOT `/index`
9. Edge cache for `/` is **never cleared**
10. Next request: edge cache HIT (stale content) → **user never sees update**

### Edge cache key-based clearing also fails

`onRevalidateComplete` also calls `clearKeysInBackground(tags, ...)` to clear edge cache entries by surrogate key tags. This requires responses to have `Surrogate-Key` HTTP headers, which requires the surrogate key middleware (`middleware.ts`). Neither this app nor the starter have `middleware.ts` set up, so key-based clearing is a no-op. Path-based clearing (via `onRouteCacheSet`) is the only mechanism that works — and it's broken for the homepage.

## Evidence

### Confirmed: `/index` path clears correctly, `/` does not

Navigating directly to `/index` shows updated content after revalidation — because the edge cache clear targets `/index`, which matches the URL. Navigating to `/` does not, because the edge cache clear targets `/index` but the cached response is stored under `/`.

This confirms the root cause is the path mismatch between Next.js's internal cache key (`/index`) and the actual URL path (`/`).

### Prior history

This same bug was the likely cause of earlier debugging sessions where the homepage failed to update even when it was configured as a standard posts page (not a static front page). The Next.js cache key for the homepage is always `/index` regardless of what content the homepage renders.

### Multi-dev logs after manual revalidation

- `[UseCacheGcsHandler] UPDATE TAGS` — use-cache handler processes tags (working)
- `[GcsCacheHandler]` — fetch cache entries deleted (working)
- `[EdgeCacheClear] cleared 4/4 keys` — key-based clear returns 200 but no-op without middleware (ineffective)
- `[getFrontPage] use-cache function EXECUTING` — use-cache entry re-executes (working)
- `[getFrontPage] Fetched page: Homepage` — fresh data fetched from WordPress (working)
- `SET: /index (route)` — fresh route stored in GCS (working)
- `GET /` → `304 Not Modified`, `HIT: /index (route)` — edge cache serves stale content (broken)

## Fix

One-line change in `cacheKeyToRoutePath` in the `@pantheon-systems/nextjs-cache-handler` package:

```javascript
cacheKeyToRoutePath(cacheKey) {
    if (cacheKey === '/index') {
        return '/';
    }
    if (cacheKey.startsWith('/')) {
        return cacheKey;
    }
    if (cacheKey.startsWith('_')) {
        return cacheKey.replace(/_/g, '/');
    }
    return `/${cacheKey}`;
}
```

The `clearSinglePath` function in `edge-cache-clear.js` already handles `/` correctly — it converts it to an empty path segment for the API call. So this fix is the only change needed.

## Verification

To confirm this diagnosis before fixing the package:

1. After triggering revalidation and waiting for the `SET: /index` log, manually clear the edge cache for `/`:
   ```bash
   curl -X DELETE "http://${OUTBOUND_PROXY_ENDPOINT}/rest/v0alpha1/cache/paths/"
   ```
2. If the homepage then shows updated content, this confirms the edge cache path mismatch is the root cause.

## Scope

- **Affected:** Only the homepage route (`/`)
- **Not affected:** All other routes (`/blog`, `/sample-page/`, `/post-slug/`, etc.)
- **Package:** `@pantheon-systems/nextjs-cache-handler` version `^0.5.0`
