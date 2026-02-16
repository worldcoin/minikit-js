/**
 * Self-contained EIP-1193 Provider for World App
 *
 * Works with any Ethereum library (viem, ethers, wagmi, or raw EIP-1193).
 * Triggers walletAuth on `eth_requestAccounts` and routes all other RPC
 * methods to MiniKit's native commands.
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
/** @internal */
export function _getAddress() {
  if (typeof window === 'undefined') return undefined;
  return window.__worldapp_eip1193_address__;
}
/** @internal */
export function _setAddress(addr) {
  if (typeof window === 'undefined') return;
  window.__worldapp_eip1193_address__ = addr;
}
/** @internal */
export function _clearAddress() {
  if (typeof window === 'undefined') return;
  window.__worldapp_eip1193_address__ = undefined;
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rpcError(code, message) {
  return Object.assign(new Error(message), { code });
}
// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------
function createProvider() {
  const listeners = {};
  function emit(event, ...args) {
    listeners[event]?.forEach((fn) => fn(...args));
  }
  // Deduplication: concurrent eth_requestAccounts calls share one promise
  let authInFlight;
  async function doAuth() {
    if (!MiniKit.isInWorldApp()) {
      throw rpcError(4900, 'World App provider only works inside World App');
    }
    try {
      const result = await MiniKit.walletAuth({
        nonce: crypto.randomUUID().replace(/-/g, ''),
        statement: 'Sign in with World App',
      });
      const addr = result.data.address;
      _setAddress(addr);
      emit('accountsChanged', [addr]);
      return [addr];
    } catch (e) {
      throw rpcError(4001, `World App wallet auth failed: ${e.message}`);
    }
  }
  return {
    async request({ method, params }) {
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
          const [data] = params;
          try {
            const result = await MiniKit.signMessage({ message: data });
            return result.data.signature;
          } catch (e) {
            throw rpcError(4001, `Sign message failed: ${e.message}`);
          }
        }
        case 'eth_signTypedData_v4': {
          const [, jsonString] = params;
          const typedData = JSON.parse(jsonString);
          try {
            const result = await MiniKit.signTypedData({
              types: typedData.types,
              primaryType: typedData.primaryType,
              domain: typedData.domain,
              message: typedData.message,
            });
            return result.data.signature;
          } catch (e) {
            throw rpcError(4001, `Sign typed data failed: ${e.message}`);
          }
        }
        case 'eth_sendTransaction': {
          const [tx] = params;
          try {
            const result = await MiniKit.sendTransaction({
              transaction: [
                {
                  address: tx.to,
                  abi: [],
                  functionName: '',
                  args: [],
                  ...(tx.data && tx.data !== '0x' ? { data: tx.data } : {}),
                  value: tx.value,
                },
              ],
            });
            return result.data.transactionId;
          } catch (e) {
            throw rpcError(4001, `Send transaction failed: ${e.message}`);
          }
        }
        case 'wallet_switchEthereumChain': {
          const [{ chainId }] = params;
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
    on(event, fn) {
      (listeners[event] ?? (listeners[event] = new Set())).add(fn);
    },
    removeListener(event, fn) {
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
export function getWorldAppProvider() {
  if (typeof window === 'undefined') {
    // SSR: return a fresh provider (will error on actual use)
    return createProvider();
  }
  if (!window.__worldapp_eip1193_provider__) {
    window.__worldapp_eip1193_provider__ = createProvider();
  }
  return window.__worldapp_eip1193_provider__;
}
