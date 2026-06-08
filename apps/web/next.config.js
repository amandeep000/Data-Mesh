/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@data-mesh/shared-types', '@data-mesh/api-contracts'],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
