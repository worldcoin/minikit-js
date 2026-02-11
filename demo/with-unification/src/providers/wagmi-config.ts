'use client';

import { http, createConfig } from 'wagmi';
import { worldchain } from 'viem/chains';
import { injected, walletConnect } from 'wagmi/connectors';

/**
 * Wagmi config with World App connector + web fallbacks.
 *
 * The worldApp() connector is intentionally omitted here because it requires
 * an async factory (dynamic import) which is not supported by createConfig.
 * Instead, MiniKit.configureWagmi(wagmiConfig) is called in the provider
 * to wire up the unified fallback system.
 *
 * In World App: unified commands use native postMessage (no Wagmi needed).
 * On web: unified commands fall back to Wagmi using this config.
 */
export const wagmiConfig = createConfig({
  chains: [worldchain],
  connectors: [
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
