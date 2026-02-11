'use client';

/**
 * Bridge component that reads Wagmi config from the WagmiProvider context
 * and passes it to MiniKit's fallback system.
 *
 * This file is dynamically imported by MiniKitProvider — if wagmi is not
 * installed, the import fails silently and this code is never loaded.
 *
 * Note: The 'wagmi' import uses @ts-ignore because TypeScript resolves
 * 'wagmi' to the local wagmi.ts entry point instead of the npm package.
 * At runtime (bundler resolution), it correctly resolves to the npm package.
 *
 * @internal Not part of the public API.
 */

import { useEffect } from 'react';
import { setWagmiConfig } from './fallback/wagmi';

// eslint-disable-next-line import/no-unresolved
// @ts-expect-error — TS resolves 'wagmi' to local wagmi.ts entry point;
// bundler correctly resolves to the wagmi npm package at runtime.
import { useConfig } from 'wagmi';

export function WagmiConfigBridge() {
  const config = useConfig();

  useEffect(() => {
    if (config) {
      setWagmiConfig(config);
    }
  }, [config]);

  return null;
}
