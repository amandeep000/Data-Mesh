/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@data-mesh/shared-types', '@data-mesh/api-contracts'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
