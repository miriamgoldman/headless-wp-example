# WordPress Headless with Next.js 16

A headless WordPress application built with Next.js 16, the WordPress REST API, and optimized for Pantheon hosting.

## Features

- **Next.js 16** with App Router, React Server Components, and `'use cache'` directive
- **Tag-Based Cache Invalidation** via surrogate keys for instant content updates
- **On-Demand Revalidation** via WordPress webhooks
- **Dual Cache Handlers** for legacy fetch cache and Next.js 16 `'use cache'`
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Optimized for Pantheon** hosting platform

## Architecture

```
/app
  /api/revalidate     - On-demand revalidation endpoint
  /blog               - Blog listing and individual posts
  /[...slug]          - Catch-all for WordPress pages

/components
  /wordpress          - WordPress-specific components

/lib/wordpress
  /client.ts          - REST API client with cache tag support
  /queries.ts         - WordPress data queries with 'use cache'
  /types.ts           - TypeScript types for REST API responses
```

## Prerequisites

- Node.js 20+ (specified in `package.json` engines field)
- WordPress backend with the REST API enabled (default in WordPress 4.7+)
- Pantheon account for deployment

## Local Development Setup

### 1. Clone and Install

```bash
npm install
cp .env.local.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local`:

```bash
WORDPRESS_API_URL=https://your-wp-site.pantheonsite.io/wp-json/wp/v2
WORDPRESS_REVALIDATE_SECRET=your-secure-random-string
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## WordPress Backend Setup

The WordPress REST API is enabled by default. Ensure your WordPress site has:

- **Permalink structure** set to anything other than "Plain" (required for REST API routing)
- **Posts or pages** published for the frontend to display

### Optional WordPress Plugins

- **Headless Mode** - Disables the WordPress frontend theme (recommended)
- **Pantheon Advanced Page Cache** - Enables surrogate key purging for on-demand revalidation

## Pantheon Deployment

### Environment Variables Setup

Use Terminus Secrets Manager to configure environment variables:

```bash
# Install Secrets Manager plugin
terminus self:plugin:install terminus-secrets-manager-plugin

# Set site-wide variables
terminus secret:site:set <site-name> WORDPRESS_REVALIDATE_SECRET "your-secret"

# Set environment-specific WordPress URLs
terminus secret:env:set <site-name>.dev WORDPRESS_API_URL "https://dev-wp.pantheonsite.io/wp-json/wp/v2"
terminus secret:env:set <site-name>.test WORDPRESS_API_URL "https://test-wp.pantheonsite.io/wp-json/wp/v2"
terminus secret:env:set <site-name>.live WORDPRESS_API_URL "https://live-wp.pantheonsite.io/wp-json/wp/v2"
```

### Automatic Variables

These are automatically set by Pantheon:
- `CACHE_BUCKET` - GCS bucket for cache storage
- `OUTBOUND_PROXY_ENDPOINT` - Edge cache proxy

### Build Process

Pantheon automatically:
1. Detects Node.js version from `package.json` engines field
2. Runs `npm ci --quiet --no-fund --no-audit`
3. Runs `npm run build`
4. Deploys to containers behind Global CDN

**Important:** Ensure only ONE lock file exists (`package-lock.json` recommended)

## Cache Strategy

### Cache Handlers

This project uses `@pantheon-systems/nextjs-cache-handler` and configures two cache handler paths in `next.config.mjs`:

- **`cache-handler.mjs`** - Legacy cache handler for fetch cache and route handlers
- **`use-cache-handler.mjs`** - Next.js 16 cache handler for the `'use cache'` directive

Both provide:
- **Dual Storage**: GCS in production, file-based locally
- **Tag-Based Invalidation**: O(1) cache clearing by surrogate key
- **Build-Aware Caching**: Auto-invalidates on new builds

### Caching Approach

All data-fetching functions use the `'use cache'` directive with infinite cache lifetime:

```typescript
export async function getPostBySlug(slug: string) {
  'use cache';
  cacheLife({ stale: Infinity, revalidate: Infinity, expire: Infinity });
  // ...
  surrogateKeys.forEach((key) => cacheTag(key));
}
```

Content stays cached until explicitly invalidated via surrogate key purging from WordPress webhooks. There is no time-based revalidation.

### On-Demand Revalidation

WordPress triggers revalidation via the `/api/revalidate` endpoint. The endpoint supports multiple payload formats:

**Surrogate keys (recommended):**
```bash
curl -X POST https://your-nextjs-site.com/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret": "YOUR_SECRET", "surrogate_keys": ["post-123", "post-my-post", "post-list"]}'
```

**Single path or tag (legacy):**
```bash
curl -X POST "https://your-nextjs-site.com/api/revalidate?secret=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"path": "/blog/my-post", "tag": "posts"}'
```

## Project Structure

### Key Files

- `next.config.mjs` - Next.js configuration with cache handlers and image optimization
- `cache-handler.mjs` - Legacy cache handler configuration
- `use-cache-handler.mjs` - Next.js 16 `'use cache'` handler configuration
- `app/layout.tsx` - Root layout with site-wide navigation
- `lib/wordpress/client.ts` - REST API client with cache tag support
- `lib/wordpress/queries.ts` - All WordPress data queries with `'use cache'`
- `components/wordpress/` - Reusable WordPress components

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server (standalone)
npm run lint     # Run ESLint
```

## Debugging

### Cache Debugging

Enable cache handler debug logging:

```bash
CACHE_DEBUG=true npm run dev
```

This shows detailed logs for cache operations (GET, SET, HIT, MISS, revalidation).

### Fetch Debugging

`next.config.mjs` includes fetch logging:

```typescript
logging: {
  fetches: {
    fullUrl: true,
  },
}
```

## Future Enhancements

- **Custom Post Types** - Extend queries and types
- **Pagination** - Blog listing pagination
- **Search** - WordPress REST API search queries
- **Preview Mode** - Draft content preview with authentication

## Pantheon-Specific Notes

### Current Limitations

- Next.js support is in **Private Beta**
- HTTP Streaming not yet available
- New Relic integration pending
- Secrets Manager required for environment variables

### Best Practices

- Use only npm (single lock file)
- Set Node.js version in `package.json` engines
- Configure images with WordPress remote patterns
- Use tag-based revalidation for efficiency

## Support

For Pantheon Next.js documentation:
- [Next.js Overview](https://docs.pantheon.io/nextjs)
- [Limitations and Considerations](https://docs.pantheon.io/nextjs/considerations)

## License

MIT
