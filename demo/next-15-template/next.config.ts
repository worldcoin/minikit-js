import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  allowedDevOrigins: ['*'], // Add your dev origin here
  reactStrictMode: false,
  // idkit-core loads WASM via import.meta.url + fs; bundling breaks that path
  serverExternalPackages: ['@worldcoin/idkit-core', '@worldcoin/idkit'],
};

export default nextConfig;
