import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*'],
  reactStrictMode: false,
  // Compile idkit-core as app source so webpack processes its
  // new URL('...wasm', import.meta.url) patterns and emits the WASM file.
  transpilePackages: ['@worldcoin/idkit-core'],
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
