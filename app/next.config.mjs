import createNextIntlPlugin from 'next-intl/plugin';
import withPWA from '@ducanh2912/next-pwa';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.paypal.com https://www.sandbox.paypal.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com",
              "frame-src https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com",
            ].join('; '),
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.+\.supabase\.co\/storage\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'product-images',
          expiration: { maxEntries: 200, maxAgeSeconds: 604800 },
        },
      },
      {
        urlPattern: /\/api\/products.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'product-api',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 },
        },
      },
    ],
  },
});

export default withNextIntl(pwaConfig(nextConfig));
