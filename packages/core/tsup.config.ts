import { defineConfig } from 'tsup';

export default defineConfig([
  {
    dts: true,
    clean: true,
    outDir: 'build',
    format: ['esm', 'cjs'],
    external: ['@worldcoin/idkit-core', 'wagmi', 'siwe', 'viem', 'react'],
    entry: ['src/index.ts', 'src/wagmi.ts'],
    define: { 'process.env.NODE_ENV': '"production"' },
  },
  {
    dts: true,
    outDir: 'build',
    format: ['esm', 'cjs'],
    external: ['@worldcoin/idkit-core', 'wagmi', 'siwe', 'viem', 'react'],
    entry: ['src/minikit-provider.tsx'],
    banner: { js: "'use client';" },
    define: { 'process.env.NODE_ENV': '"production"' },
  },
]);
