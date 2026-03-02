import { defineConfig } from 'tsup';

export default defineConfig({
  dts: true,
  clean: true,
  outDir: 'build',
  format: ['esm', 'cjs'],
  external: ['wagmi', 'siwe', 'viem', 'react', 'react-dom'],
  entry: [
    'src/index.ts',
    'src/connector/index.ts',
    'src/command-exports.ts',
    'src/siwe-exports.ts',
    'src/address-book.ts',
    'src/minikit-provider.tsx',
  ],
  define: { 'process.env.NODE_ENV': '"production"' },
});
