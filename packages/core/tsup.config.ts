import { defineConfig } from 'tsup';

export default defineConfig({
  dts: true,
  clean: true,
  outDir: 'build',
  format: ['esm', 'cjs'],
  external: ['@worldcoin/idkit-core'],
  entry: ['index.ts', 'minikit-provider.tsx'],
  define: { 'process.env.NODE_ENV': '"production"' },
});
