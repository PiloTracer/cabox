import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * Always resolve a valid base URL — next-auth/react throws TypeError Invalid URL when
 * NEXTAUTH_URL is '' (common when compose passes empty vars over env_file).
 */
function resolveNextAuthUrl() {
  const candidates = [
    process.env.NEXTAUTH_URL?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined,
    'http://localhost:3000',
  ];
  for (const c of candidates) {
    if (c) return c;
  }
  return 'http://localhost:3000';
}

const nextAuthUrl = resolveNextAuthUrl();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  env: {
    NEXTAUTH_URL: nextAuthUrl,
  },

  /** Legacy links opened /es/evolution/api/... (department route ate /api); forward to App Router API. */
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/es/evolution/api/:path*', destination: '/api/:path*' },
        { source: '/en/evolution/api/:path*', destination: '/api/:path*' },
      ],
    };
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },

  // Experimental
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default withNextIntl(nextConfig);
