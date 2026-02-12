import { defineConfig } from 'tsup';

export default defineConfig({
  dts: true,
  clean: true,
  outDir: 'build',
  format: ['esm', 'cjs'],
  external: ['@worldcoin/idkit-core', 'wagmi', 'siwe', 'viem', 'react'],
  entry: ['index.ts'],
  define: { 'process.env.NODE_ENV': '"production"' },
});
