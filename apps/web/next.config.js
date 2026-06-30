/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@data-mesh/shared-types', '@data-mesh/api-contracts'],
};

module.exports = nextConfig;
