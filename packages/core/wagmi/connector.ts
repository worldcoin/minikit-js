/**
 * World App Wagmi Connector
 *
 * Thin wrapper that delegates to the shared EIP-1193 provider from
 * `@worldcoin/minikit-js`. All auth and RPC logic lives in the provider;
 * this connector just adapts the interface for wagmi.
 */

import { MiniKit } from '../minikit';
import {
  getWorldAppProvider,
  _getAddress,
  _setAddress,
  _clearAddress,
} from '../provider';

export type WorldAppConnectorOptions = {
  /** Custom name for the connector */
  name?: string;
};

/**
 * Create a World App connector for Wagmi
 *
 * When running inside World App, this connector uses native MiniKit commands
 * via the shared EIP-1193 provider. It should be placed first in the
 * connectors list so it's used automatically in World App.
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
    const provider = getWorldAppProvider();

    return {
      id: 'worldApp',
      name,
      type: 'worldApp' as const,

      async setup() {
        // Restore address from MiniKit state if already authenticated
        const existing = MiniKit.user?.walletAddress;
        if (existing) {
          _setAddress(existing as `0x${string}`);
        }
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async connect(_parameters?: any): Promise<any> {
        // eth_requestAccounts triggers walletAuth inside the provider
        const accounts = (await provider.request({
          method: 'eth_requestAccounts',
        })) as `0x${string}`[];

        return {
          accounts: accounts as readonly `0x${string}`[],
          chainId: 480,
        };
      },

      async disconnect() {
        _clearAddress();
      },

      async getAccounts() {
        const addr = _getAddress();
        return addr
          ? ([addr] as readonly `0x${string}`[])
          : ([] as readonly `0x${string}`[]);
      },

      async getChainId() {
        return 480;
      },

      async getProvider() {
        return provider;
      },

      async isAuthorized() {
        return MiniKit.isInWorldApp() && !!_getAddress();
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
