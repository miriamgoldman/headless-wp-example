# WordPress Headless with Next.js 15

A modern headless WordPress application built with Next.js 15, WPGraphQL, and optimized for Pantheon hosting.

## Features

- **Next.js 15** with App Router and React Server Components
- **Incremental Static Regeneration (ISR)** with shared cache via `@pantheon-systems/nextjs-cache-handler`
- **Tag-Based Cache Invalidation** for efficient content updates
- **On-Demand Revalidation** via WordPress webhooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Optimized for Pantheon** hosting platform

## Architecture

### Next.js Application

```
/app
  /api/revalidate     - On-demand revalidation endpoint
  /blog               - Blog listing and individual posts
  /[...slug]          - Catch-all for WordPress pages

/components
  /wordpress          - WordPress-specific components

/lib/wordpress
  /client.ts          - GraphQL client with tag support
  /queries.ts         - WordPress data queries
  /types.ts           - TypeScript types
  /fragments.ts       - Reusable GraphQL fragments
```

## Prerequisites

- Node.js 20+ (specified in `package.json` engines field)
- WordPress backend with WPGraphQL installed
- Pantheon account for deployment

## Local Development Setup

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local`:

```bash
WORDPRESS_API_URL=https://your-wp-site.pantheonsite.io/graphql
WORDPRESS_REVALIDATE_SECRET=your-secure-random-string
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## WordPress Backend Setup

See [WORDPRESS_REQUIREMENTS.md](./WORDPRESS_REQUIREMENTS.md) for complete WordPress configuration instructions.

### Required WordPress Plugins

1. **WPGraphQL** - Core GraphQL API
2. **WPGraphQL CORS** - Cross-origin request handling
3. **WPGraphQL for ACF** - Future ACF support (optional)
4. **Headless Mode** - Disable WP front-end (recommended)

## Pantheon Deployment

### Environment Variables Setup

Use Terminus Secrets Manager to configure environment variables:

```bash
# Install Secrets Manager plugin
terminus self:plugin:install terminus-secrets-manager-plugin

# Set site-wide variables
terminus secret:site:set <site-name> WORDPRESS_REVALIDATE_SECRET "your-secret"

# Set environment-specific WordPress URLs
terminus secret:env:set <site-name>.dev WORDPRESS_API_URL "https://dev-wp.pantheonsite.io/graphql"
terminus secret:env:set <site-name>.test WORDPRESS_API_URL "https://test-wp.pantheonsite.io/graphql"
terminus secret:env:set <site-name>.live WORDPRESS_API_URL "https://live-wp.pantheonsite.io/graphql"
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

### Cache Handler

This project uses `@pantheon-systems/nextjs-cache-handler` which provides:

- **Dual Cache Support**: GCS in production, file-based locally
- **Tag-Based Invalidation**: O(1) cache clearing by tag
- **Build-Aware Caching**: Auto-invalidates on new builds
- **Buffer Serialization**: Next.js 15 compatibility

### Revalidation Times

- **Homepage**: 1 hour (3600s)
- **Blog Listing**: 30 minutes (1800s)
- **Blog Posts**: 1 hour (3600s)
- **Pages**: 2 hours (7200s)

### On-Demand Revalidation

WordPress can trigger revalidation via webhook:

```bash
curl -X POST https://your-nextjs-site.com/api/revalidate?secret=YOUR_SECRET \
  -H "Content-Type: application/json" \
  -d '{"path": "/blog/my-post", "tag": "posts"}'
```

## Project Structure

### Key Files

- `cacheHandler.ts` - Cache handler configuration
- `next.config.ts` - Next.js configuration with cache handler and image optimization
- `app/layout.tsx` - Root layout with site-wide navigation
- `lib/wordpress/client.ts` - GraphQL client with tag support
- `lib/wordpress/queries.ts` - All WordPress data queries
- `components/wordpress/` - Reusable WordPress components

### Route Configuration

All routes use ISR with appropriate revalidation times and cache tags for efficient invalidation.

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Debugging

### Cache Debugging

Enable cache handler debug logging:

```bash
CACHE_DEBUG=true npm run dev
```

This shows detailed logs for cache operations (GET, SET, HIT, MISS, revalidation).

### GraphQL Debugging

Check `next.config.ts` logging configuration:

```typescript
logging: {
  fetches: {
    fullUrl: true,
  },
}
```

## Future Enhancements

This architecture is ready for:

- **Advanced Custom Fields (ACF)** - Types and fragments prepared
- **Custom Post Types** - Easily extend queries and types
- **Flexible Content Blocks** - ACF flexible content support
- **Pagination** - Blog listing pagination
- **Search Functionality** - WPGraphQL search queries
- **Authentication** - Preview mode for draft content

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

For WordPress backend configuration, see [WORDPRESS_REQUIREMENTS.md](./WORDPRESS_REQUIREMENTS.md)

For Pantheon Next.js documentation:
- [Next.js Overview](https://docs.pantheon.io/nextjs)
- [Limitations and Considerations](https://docs.pantheon.io/nextjs/considerations)

## License

MIT
