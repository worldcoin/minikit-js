const nextConfig = {
  serverExternalPackages: ['@worldcoin/idkit-core'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // idkit-core bundles server-only code (fs/promises for WASM loading)
      // in the same entry point as client code. Stub it out for the browser.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'fs/promises': false,
        fs: false,
      };
    }
    return config;
  },
};
export default nextConfig;
