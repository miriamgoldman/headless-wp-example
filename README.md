This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

---

## Next.js 16 Specific Features

This template includes Next.js 16 with the following enhancements:

### Features

- Next.js 16.1.6 with Turbopack (default bundler)
- React 19.2.0
- TypeScript 5
- Pantheon cache handler with auto-detection (GCS/file-based)
- Minimal and unopinionated (no styling framework)
- App Router architecture

### Cache Handler

This template includes `@pantheon-systems/nextjs-cache-handler` pre-configured with auto-detection:

- **Production (Pantheon):** Uses Google Cloud Storage when `CACHE_BUCKET` environment variable is set
- **Development (Local):** Uses file-based caching

#### Configuration

Next.js 16 introduces a dual cache handler system configured in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  // Required for Pantheon deployment
  output: 'standalone',

  // Transpile the cache handler package
  transpilePackages: ['@pantheon-systems/nextjs-cache-handler'],

  // Next.js 16 Cache Components
  cacheComponents: true,

  // Custom cache life profiles for 'use cache' directive
  cacheLife: {
    short: { stale: 30, revalidate: 60, expire: 300 },
    blog: { stale: 60, revalidate: 300, expire: 3600 },
  },

  // Legacy cache handler (ISR, route handlers, fetch cache)
  cacheHandler: path.resolve('./cacheHandler.ts'),

  // Next.js 16 cache handlers for 'use cache' directive
  cacheHandlers: {
    default: path.resolve('./use-cache-handler.ts'),
    remote: path.resolve('./use-cache-handler.ts'),
  },

  // Disable in-memory caching
  cacheMaxMemorySize: 0,
};
```

**Two Cache Handlers:**
- `cacheHandler.ts`: Legacy handler for ISR, route handlers, and fetch cache
- `use-cache-handler.ts`: Next.js 16 handler for the new `'use cache'` directive

#### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CACHE_BUCKET` | GCS bucket name for cache storage | Required for production |
| `OUTBOUND_PROXY_ENDPOINT` | Edge cache proxy endpoint | Optional |
| `CACHE_DEBUG` | Enable debug logging (`true` or `1`) | Optional |

#### Example .env

```bash
# Production (Pantheon)
CACHE_BUCKET=your-gcs-bucket-name

# Optional
CACHE_DEBUG=true
OUTBOUND_PROXY_ENDPOINT=https://your-edge-cache-endpoint
```

### Migrating from Next.js 15

This template supports migration from Next.js 15 to 16:

#### Turbopack (Default in v16)

- **No webpack config:** Works out of the box with Turbopack
- **Has webpack config:** Remove it or use `npm run build -- --webpack` to keep using Webpack
- **Already using Turbopack in v15:** Seamless migration, no changes needed

#### Key Changes in Next.js 16

- Turbopack is now stable and default (was experimental in v15)
- New cache system with explicit `use cache` directive
- `cacheComponents` flag for new caching features
- Improved performance and build times

### Project Structure

```
nextjs-v16-upstream/
├── app/
│   ├── favicon.ico          # App favicon
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── public/                  # Static SVG assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .gitignore               # Git ignore file
├── cacheHandler.ts          # Legacy cache handler (ISR, route handlers, fetch)
├── eslint.config.mjs        # ESLint configuration
├── LICENSE                  # MIT License
├── next-env.d.ts            # Next.js TypeScript declarations
├── next.config.ts           # Next.js configuration with dual cache handlers
├── package.json             # Dependencies
├── postcss.config.mjs       # PostCSS configuration for Tailwind
├── README.md                # This file
├── tsconfig.json            # TypeScript configuration
└── use-cache-handler.ts     # Next.js 16 'use cache' directive handler
```

### Additional Resources

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Pantheon Cache Handler](https://github.com/pantheon-systems/nextjs-cache-handler)
- [Turbopack Documentation](https://nextjs.org/docs/app/api-reference/turbopack)

### Support

For issues related to:
- **Next.js:** [Next.js GitHub](https://github.com/vercel/next.js)
- **Pantheon Cache Handler:** [pantheon-systems/nextjs-cache-handler](https://github.com/pantheon-systems/nextjs-cache-handler)
- **Pantheon Platform:** [Pantheon Documentation](https://docs.pantheon.io)
