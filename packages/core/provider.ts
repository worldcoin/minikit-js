/**
 * Self-contained EIP-1193 Provider for World App
 *
 * Works with any Ethereum library (viem, ethers, wagmi, or raw EIP-1193).
 * Triggers walletAuth on `eth_requestAccounts` and routes all other RPC
 * methods to MiniKit's native async commands.
 *
 * @example
 * ```typescript
 * // viem
 * import { createWalletClient, custom } from 'viem';
 * import { getWorldAppProvider } from '@worldcoin/minikit-js';
 * const client = createWalletClient({ transport: custom(getWorldAppProvider()), chain: worldchain });
 *
 * // ethers
 * import { BrowserProvider } from 'ethers';
 * import { getWorldAppProvider } from '@worldcoin/minikit-js';
 * const provider = new BrowserProvider(getWorldAppProvider());
 * ```
 */

import { MiniKit } from './minikit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorldAppProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, fn: (...args: unknown[]) => void) => void;
  removeListener: (event: string, fn: (...args: unknown[]) => void) => void;
};

// ---------------------------------------------------------------------------
// Window-based address state (shared across bundles)
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __worldapp_eip1193_provider__?: WorldAppProvider;
    __worldapp_eip1193_address__?: `0x${string}`;
  }
}

/** @internal */
export function _getAddress(): `0x${string}` | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.__worldapp_eip1193_address__;
}

/** @internal */
export function _setAddress(addr: `0x${string}`): void {
  if (typeof window === 'undefined') return;
  window.__worldapp_eip1193_address__ = addr;
}

/** @internal */
export function _clearAddress(): void {
  if (typeof window === 'undefined') return;
  window.__worldapp_eip1193_address__ = undefined;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rpcError(code: number, message: string) {
  return Object.assign(new Error(message), { code });
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

function createProvider(): WorldAppProvider {
  const listeners: Record<string, Set<(...args: unknown[]) => void>> = {};

  function emit(event: string, ...args: unknown[]) {
    listeners[event]?.forEach((fn) => fn(...args));
  }

  // Deduplication: concurrent eth_requestAccounts calls share one promise
  let authInFlight: Promise<`0x${string}`[]> | undefined;

  async function doAuth(): Promise<`0x${string}`[]> {
    if (!MiniKit.isInWorldApp()) {
      throw rpcError(4900, 'World App provider only works inside World App');
    }

    const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
      nonce: crypto.randomUUID(),
      statement: 'Sign in with World App',
    });

    if (finalPayload.status !== 'success') {
      const errorCode =
        'error_code' in finalPayload ? finalPayload.error_code : 'unknown';
      throw rpcError(4001, `World App wallet auth failed: ${errorCode}`);
    }

    const addr = finalPayload.address as `0x${string}`;
    _setAddress(addr);
    emit('accountsChanged', [addr]);
    return [addr];
  }

  return {
    async request({ method, params }: { method: string; params?: unknown[] }) {
      switch (method) {
        case 'eth_requestAccounts': {
          // Return cached address if already authed
          const existing = _getAddress();
          if (existing) return [existing];

          // Deduplicate concurrent calls
          if (!authInFlight) {
            authInFlight = doAuth().finally(() => {
              authInFlight = undefined;
            });
          }
          return authInFlight;
        }

        case 'eth_accounts': {
          const addr = _getAddress();
          return addr ? [addr] : [];
        }

        case 'eth_chainId':
          return '0x1e0'; // 480 = World Chain

        case 'personal_sign': {
          const [data] = params as [string, string];
          const { finalPayload } = await MiniKit.commandsAsync.signMessage({
            message: data,
          });
          if (finalPayload.status !== 'success') {
            throw rpcError(
              4001,
              'error_code' in finalPayload
                ? `Sign message failed: ${finalPayload.error_code}`
                : 'Sign message rejected',
            );
          }
          return finalPayload.signature;
        }

        case 'eth_signTypedData_v4': {
          const [, jsonString] = params as [string, string];
          const typedData = JSON.parse(jsonString);
          const { finalPayload } =
            await MiniKit.commandsAsync.signTypedData({
              types: typedData.types,
              primaryType: typedData.primaryType,
              domain: typedData.domain,
              message: typedData.message,
            });
          if (finalPayload.status !== 'success') {
            throw rpcError(
              4001,
              'error_code' in finalPayload
                ? `Sign typed data failed: ${finalPayload.error_code}`
                : 'Sign typed data rejected',
            );
          }
          return finalPayload.signature;
        }

        case 'eth_sendTransaction': {
          const [tx] = params as [
            { to: string; data?: string; value?: string },
          ];

          const { finalPayload } =
            await MiniKit.commandsAsync.sendTransaction({
              transaction: [
                {
                  address: tx.to as `0x${string}`,
                  abi: [],
                  functionName: '',
                  args: [],
                  ...(tx.data && tx.data !== '0x' ? { data: tx.data } : {}),
                  value: tx.value,
                },
              ],
            });
          if (finalPayload.status !== 'success') {
            throw rpcError(
              4001,
              'error_code' in finalPayload
                ? `Send transaction failed: ${finalPayload.error_code}`
                : 'Transaction rejected',
            );
          }
          return finalPayload.transaction_id;
        }

        case 'wallet_switchEthereumChain': {
          const [{ chainId }] = params as [{ chainId: string }];
          if (Number(chainId) !== 480) {
            throw rpcError(4902, 'World App only supports World Chain (480)');
          }
          return null;
        }

        case 'wallet_addEthereumChain': {
          throw rpcError(4200, 'World App only supports World Chain (480)');
        }

        default:
          throw rpcError(4200, `Unsupported method: ${method}`);
      }
    },

    on(event: string, fn: (...args: unknown[]) => void) {
      (listeners[event] ??= new Set()).add(fn);
    },

    removeListener(event: string, fn: (...args: unknown[]) => void) {
      listeners[event]?.delete(fn);
    },
  };
}

// ---------------------------------------------------------------------------
// Public API — singleton via window global
// ---------------------------------------------------------------------------

/**
 * Get the EIP-1193 provider for World App.
 *
 * Returns a singleton instance (stored on `window`) so all consumers
 * share the same provider and address state, even across separate bundles.
 */
export function getWorldAppProvider(): WorldAppProvider {
  if (typeof window === 'undefined') {
    // SSR: return a fresh provider (will error on actual use)
    return createProvider();
  }

  if (!window.__worldapp_eip1193_provider__) {
    window.__worldapp_eip1193_provider__ = createProvider();
  }

  return window.__worldapp_eip1193_provider__;
}
