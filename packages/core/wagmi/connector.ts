/**
 * World App Wagmi Connector
 *
 * Allows using World App as a Wagmi connector. When connected through this
 * connector, wallet operations use native MiniKit commands under the hood.
 *
 * Returns an EIP-1193-compliant provider from getProvider() so wagmi hooks
 * (useSignMessage, useSendTransaction, etc.) work transparently.
 */

import { MiniKit } from '../minikit';
import { createWorldAppProvider, type WorldAppProvider } from './provider';

export type WorldAppConnectorOptions = {
  /** Custom name for the connector */
  name?: string;
};

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

  // wagmi's createConnector is an identity function for type inference.
  // We return the CreateConnectorFn directly to avoid importing 'wagmi'
  // (which collides with the local wagmi/ directory due to baseUrl).
  return createConnectorFn(name);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createConnectorFn(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (config: any) => {
    let address: `0x${string}` | undefined;

    const provider: WorldAppProvider = createWorldAppProvider(
      () => address,
    );

    return {
      id: 'worldApp',
      name,
      type: 'worldApp' as const,

      async setup() {
        // Try to restore address from MiniKit state if already authenticated
        const existing = MiniKit.user?.walletAddress;
        if (existing) {
          address = existing as `0x${string}`;
        }
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async connect(_parameters?: any): Promise<any> {
        if (!MiniKit.isInWorldApp()) {
          throw new Error('worldApp connector only works inside World App');
        }

        const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
          nonce: crypto.randomUUID(),
          statement: 'Sign in with World App',
        });

        if (finalPayload.status !== 'success') {
          const errorCode =
            'error_code' in finalPayload ? finalPayload.error_code : 'unknown';
          throw new Error(`World App wallet auth failed: ${errorCode}`);
        }

        address = finalPayload.address as `0x${string}`;

        return {
          accounts: [address] as readonly `0x${string}`[],
          chainId: 480,
        };
      },

      async disconnect() {
        address = undefined;
      },

      async getAccounts() {
        return address ? [address] as readonly `0x${string}`[] : [] as readonly `0x${string}`[];
      },

      async getChainId() {
        return 480;
      },

      async getProvider() {
        return provider;
      },

      async isAuthorized() {
        return MiniKit.isInWorldApp() && !!address;
      },

      async switchChain({ chainId }: { chainId: number }) {
        if (chainId !== 480) {
          throw new Error(
            'World App only supports World Chain (chainId: 480)',
          );
        }
        return (
          config.chains.find((c: { id: number }) => c.id === 480) ??
          config.chains[0]
        );
      },

      onAccountsChanged(_accounts: string[]) {},
      onChainChanged(_chainId: string) {},
      onDisconnect() {},
    };
  };
}
