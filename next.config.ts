import type { NextConfig } from 'next';

// PostHog ingestion host (US or EU cloud); the browser reaches it through /ingest on our own domain.
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // PostHog's API paths end in a slash; redirecting them would break ingestion.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: `${posthogHost.replace('.i.posthog.com', '-assets.i.posthog.com')}/static/:path*` },
      { source: '/ingest/array/:path*', destination: `${posthogHost.replace('.i.posthog.com', '-assets.i.posthog.com')}/array/:path*` },
      { source: '/ingest/:path*', destination: `${posthogHost}/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=31536000' }],
      },
    ];
  },
};

export default nextConfig;
