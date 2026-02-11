/**
 * World App Wagmi Connector
 *
 * Allows using World App as a Wagmi connector. When connected through this
 * connector, wallet operations use native MiniKit commands under the hood.
 */

import { MiniKit } from '../../minikit';

export type WorldAppConnectorOptions = {
  /** Custom name for the connector */
  name?: string;
};

// Type definition for the connector config parameter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WagmiCreateConnectorConfig = any;

/**
 * Create a World App connector for Wagmi
 *
 * When running inside World App, this connector uses native MiniKit commands.
 * It should be placed first in the connectors list so it's used automatically
 * in World App.
 *
 * @example
 * ```typescript
 * import { createConfig } from 'wagmi';
 * import { worldApp } from '@worldcoin/minikit-js/wagmi';
 *
 * const wagmiConfig = createConfig({
 *   connectors: [
 *     worldApp(),           // Uses native MiniKit in World App
 *     injected(),           // Fallback for web
 *     walletConnect({ ... }),
 *   ],
 *   // ...
 * });
 * ```
 */
export function worldApp(options: WorldAppConnectorOptions = {}) {
  const name = options.name ?? 'World App';

  // Dynamically import wagmi to avoid bundling if not used
  // We use a variable to store the module path to avoid TypeScript
  // resolving 'wagmi' to our local wagmi.ts file
  return async () => {
    // Dynamic import using a variable to prevent TS from resolving to local file
    const wagmiModule = 'wagmi';
    const { createConnector } = await import(/* webpackIgnore: true */ wagmiModule);

    return createConnector((config: WagmiCreateConnectorConfig) => ({
      id: 'worldApp',
      name,
      type: 'worldApp' as const,

      async setup() {
        // No setup needed - MiniKit.install() handles initialization
      },

      async connect() {
        if (!MiniKit.isInWorldApp()) {
          throw new Error('worldApp connector only works inside World App');
        }

        // Use MiniKit wallet auth to get the address
        const result = await MiniKit.walletAuth({
          nonce: crypto.randomUUID(),
          statement: 'Sign in with World App',
        });

        const address = result.data.address as `0x${string}`;

        return {
          accounts: [address],
          chainId: 480, // World Chain
        };
      },

      async disconnect() {
        // World App doesn't support disconnect - session persists
      },

      async getAccounts() {
        const walletAddress = MiniKit.user?.walletAddress;
        if (!walletAddress) {
          return [];
        }
        return [walletAddress as `0x${string}`];
      },

      async getChainId() {
        return 480; // World Chain
      },

      async getProvider() {
        // World App doesn't expose a traditional provider
        // Return undefined or a minimal shim
        return undefined;
      },

      async isAuthorized() {
        if (!MiniKit.isInWorldApp()) {
          return false;
        }
        return Boolean(MiniKit.user?.walletAddress);
      },

      async switchChain({ chainId }: { chainId: number }) {
        // World App only supports World Chain
        if (chainId !== 480) {
          throw new Error('World App only supports World Chain (chainId: 480)');
        }
        return config.chains.find((c: { id: number }) => c.id === 480) ?? config.chains[0];
      },

      onAccountsChanged(_accounts: string[]) {
        // World App doesn't emit account changes
      },

      onChainChanged(_chainId: string) {
        // World App doesn't emit chain changes
      },

      onDisconnect() {
        // World App doesn't emit disconnect
      },
    }));
  };
}
