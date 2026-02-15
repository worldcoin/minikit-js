import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // In this monorepo, dependencies resolve from workspace root node_modules.
  // Trace from repo root so serverless functions can include those files.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  images: {
    domains: ['static.usernames.app-backend.toolsforhumanity.com'],
  },
  // Ensure IDKit core's WASM file is bundled for server routes that call
  // IDKit.initServer()/signRequest.
  transpilePackages: ['@worldcoin/idkit-core'],
  // NOTE: outputFileTracingIncludes is a top-level Next.js config key.
  outputFileTracingIncludes: {
    '/api/**': [
      './node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
      './node_modules/.pnpm/@worldcoin+idkit-core@*/node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
      '../../node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
      '../../node_modules/.pnpm/@worldcoin+idkit-core@*/node_modules/@worldcoin/idkit-core/dist/idkit_wasm_bg.wasm',
    ],
  },
};

export default nextConfig;
