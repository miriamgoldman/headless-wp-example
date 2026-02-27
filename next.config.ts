import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required for Pantheon deployment
  output: 'standalone',

  // Transpile the cache handler package
  transpilePackages: ['@pantheon-systems/nextjs-cache-handler'],

  // Next.js 16 Cache Components configuration
  cacheComponents: true,

  // Custom cache life profiles for 'use cache' directive
  cacheLife: {
    // Short-lived cache for testing (30s stale, 60s revalidate, 5min expire)
    short: {
      stale: 30,
      revalidate: 60,
      expire: 300,
    },
    // Blog-style cache (1min stale, 5min revalidate, 1hr expire)
    blog: {
      stale: 60,
      revalidate: 300,
      expire: 3600,
    },
  },

  // Legacy cache handler for ISR, route handlers, fetch cache
  cacheHandler: path.resolve('./cacheHandler.ts'),

  // Next.js 16 cache handlers for 'use cache' directive
  cacheHandlers: {
    default: path.resolve('./use-cache-handler.ts'),
    remote: path.resolve('./use-cache-handler.ts'),
  },

  // Disable in-memory caching to use custom handler
  cacheMaxMemorySize: 0,
};

export default nextConfig;
