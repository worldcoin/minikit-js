import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'], // Output ES Module
  target: 'node18', // Target Node.js 18
  platform: 'node',
  splitting: false,
  sourcemap: false, // No sourcemaps needed for CLI tool
  minify: true, // Minify the output
  clean: true, // Clean the output directory before building
  dts: false, // No declaration files needed for this CLI
  banner: {
    js: '#!/usr/bin/env node', // Add shebang to make it executable
  },
});
