import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*'],
  reactStrictMode: false,
  // Compile idkit-core as app source so webpack can bundle server-side WASM usage.
  transpilePackages: ['@worldcoin/idkit-core'],
  experimental: {
    outputFileTracingIncludes: {
      '/api/rp-signature': [
        './node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
        './node_modules/.pnpm/@worldcoin+idkit-core@*/node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
      ],
      '/api/rp-signature/route': [
        './node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
        './node_modules/.pnpm/@worldcoin+idkit-core@*/node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
      ],
    },
  },
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
