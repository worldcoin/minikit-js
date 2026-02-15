import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/**': [
      './node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
      './node_modules/.pnpm/@worldcoin+idkit-core@*/node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
    ],
  },
};

export default nextConfig;
