import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.simpleicons.org', pathname: '/**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/surveys/preview/:id',
        destination: '/preview/:id',
      },
    ];
  },
};

export default nextConfig;
