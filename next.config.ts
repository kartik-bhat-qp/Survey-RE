import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
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
