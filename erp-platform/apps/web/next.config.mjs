/** @type {import('next').NextConfig} */
const isGhPages = process.env.BUILD_TARGET === 'gh-pages';

const nextConfig = {
  output: isGhPages ? 'export' : 'standalone',
  basePath: isGhPages ? '/ventech' : '',
  images: {
    unoptimized: true,
  },
  turbopack: {},
  ...(!isGhPages ? {
    async rewrites() {
      const apiBase = process.env.API_URL || 'http://api:3001';
      return [
        {
          source: '/api/:path*',
          destination: `${apiBase}/api/:path*`,
        },
      ];
    },
  } : {}),
};

export default nextConfig;
