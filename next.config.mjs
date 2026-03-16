import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Pantheon deployment
  output: 'standalone',

  // Enable 'use cache' directive for Next.js 16
  cacheComponents: true,

  // Legacy cache handler for ISR, route handlers, and fetch cache
  cacheHandler: path.resolve(__dirname, './cache-handler.mjs'),

  // Next.js 16 cache handlers for 'use cache' directive
  cacheHandlers: {
    remote: path.resolve(__dirname, './use-cache-handler.mjs'),
  },

  // Disable in-memory cache to use Pantheon cache handler
  cacheMaxMemorySize: 0,

  // Required for Pantheon cache handler package
  transpilePackages: ['@pantheon-systems/nextjs-cache-handler'],

  // Image optimization for WordPress media
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.pantheonsite.io',
        pathname: '/wp-content/uploads/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enable logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

};

export default nextConfig;
