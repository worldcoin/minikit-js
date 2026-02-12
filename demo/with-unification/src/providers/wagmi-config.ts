'use client';

import { http, createConfig } from 'wagmi';
import { worldchain } from 'viem/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { worldApp } from '@worldcoin/minikit-js';

/**
 * Wagmi config with World App connector + web fallbacks.
 *
 * worldApp() is listed first so it auto-connects in World App.
 * On web it's skipped (throws during connect) and injected/WC take over.
 *
 * This same config is also passed to MiniKitProvider so the unified API
 * (MiniKit.walletAuth, MiniKit.sendTransaction) can fall back to wagmi on web.
 */
export const wagmiConfig = createConfig({
  chains: [worldchain],
  connectors: [
    worldApp(), // Auto-detected in World App, skipped on web
    injected(),
    ...(process.env.NEXT_PUBLIC_WC_PROJECT_ID
      ? [
          walletConnect({
            projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
          }),
        ]
      : []),
  ],
  transports: {
    [worldchain.id]: http('https://worldchain-mainnet.g.alchemy.com/public'),
  },
});
