import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*'],
  reactStrictMode: false,
  webpack: (config) => {
    // Wagmi v3 bundles MetaMask SDK and other connectors that pull in
    // optional native/server dependencies. These are not used at runtime
    // in the browser, so we stub them out.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'fs/promises': false,
      fs: false,
      net: false,
      tls: false,
      '@react-native-async-storage/async-storage': false,
      '@base-org/account': false,
    };
    return config;
  },
};

export default nextConfig;
