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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorldAppProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
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

function isHexString(value: string): boolean {
  return /^0x[0-9a-fA-F]*$/.test(value);
}

function isAddressString(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

function decodeHexToUtf8(hex: string): string {
  const raw = hex.slice(2);
  if (raw.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }

  const bytes = new Uint8Array(raw.length / 2);
  for (let i = 0; i < raw.length; i += 2) {
    bytes[i / 2] = parseInt(raw.slice(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

function asArrayParams(params?: unknown): unknown[] {
  if (params === undefined) return [];
  return Array.isArray(params) ? params : [params];
}

function decodeMaybeHexMessage(value: string): string {
  if (!isHexString(value)) {
    return value;
  }

  try {
    return decodeHexToUtf8(value);
  } catch {
    // Keep raw hex if decoding fails. MiniKit may still choose to handle it.
    return value;
  }
}

function extractPersonalSignMessage(params?: unknown): string {
  const items = asArrayParams(params);
  if (items.length === 0) {
    throw new Error('Missing personal_sign params');
  }

  const [first, second] = items;
  const maybeMessage =
    typeof first === 'string' &&
    isAddressString(first) &&
    typeof second === 'string'
      ? second
      : first;

  if (typeof maybeMessage !== 'string') {
    throw new Error('Invalid personal_sign message payload');
  }

  return decodeMaybeHexMessage(maybeMessage);
}

function extractEthSignMessage(params?: unknown): string {
  const items = asArrayParams(params);
  if (items.length === 0) {
    throw new Error('Missing eth_sign params');
  }
  const [first, second] = items;
  const maybeMessage =
    typeof second === 'string'
      ? second
      : typeof first === 'string' && !isAddressString(first)
        ? first
        : undefined;

  if (typeof maybeMessage !== 'string') {
    throw new Error('Invalid eth_sign message payload');
  }

  return decodeMaybeHexMessage(maybeMessage);
}

function parseTypedDataInput(
  params?: unknown,
): {
  types: Record<string, unknown>;
  primaryType: string;
  domain?: Record<string, unknown>;
  message: Record<string, unknown>;
  chainId?: number;
} {
  const items = asArrayParams(params);
  const candidate = items.length > 1 ? items[1] : items[0];
  if (!candidate) {
    throw new Error('Missing typed data payload');
  }

  const parsed =
    typeof candidate === 'string'
      ? JSON.parse(candidate)
      : (candidate as Record<string, unknown>);

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.primaryType !== 'string' ||
    typeof parsed.message !== 'object' ||
    !parsed.message ||
    typeof parsed.types !== 'object' ||
    !parsed.types
  ) {
    throw new Error('Invalid typed data payload');
  }

  const domainValue = parsed.domain as Record<string, unknown> | undefined;
  const chainIdValue = (domainValue?.chainId ?? parsed.chainId) as
    | number
    | string
    | undefined;
  const parsedChainId =
    typeof chainIdValue === 'string'
      ? Number(chainIdValue)
      : typeof chainIdValue === 'number'
        ? chainIdValue
        : undefined;

  return {
    types: parsed.types as Record<string, unknown>,
    primaryType: parsed.primaryType,
    domain: domainValue,
    message: parsed.message as Record<string, unknown>,
    ...(Number.isFinite(parsedChainId) ? { chainId: parsedChainId } : {}),
  };
}

function normalizeRpcValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'bigint') return `0x${value.toString(16)}`;
  if (typeof value === 'number') return `0x${value.toString(16)}`;
  return String(value);
}

function extractTransactionParams(params?: unknown): {
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: string;
  chainId?: number;
} {
  const items = asArrayParams(params);
  const tx = (items[0] ?? {}) as {
    to?: string;
    data?: string;
    value?: unknown;
    chainId?: unknown;
  };
  if (typeof tx.to !== 'string' || !isAddressString(tx.to)) {
    throw new Error('Invalid transaction "to" address');
  }

  const chainId =
    typeof tx.chainId === 'string'
      ? Number(tx.chainId)
      : typeof tx.chainId === 'number'
        ? tx.chainId
        : undefined;
  const normalizedValue = normalizeRpcValue(tx.value);

  return {
    to: tx.to as `0x${string}`,
    ...(typeof tx.data === 'string' ? { data: tx.data as `0x${string}` } : {}),
    ...(normalizedValue !== undefined ? { value: normalizedValue } : {}),
    ...(Number.isFinite(chainId) ? { chainId } : {}),
  };
}

function extractSwitchChainId(params?: unknown): number {
  const items = asArrayParams(params);
  const payload = (items[0] ?? {}) as { chainId?: unknown };
  const rawChainId = payload.chainId;
  const chainId =
    typeof rawChainId === 'string'
      ? Number(rawChainId)
      : typeof rawChainId === 'number'
        ? rawChainId
        : NaN;

  if (!Number.isFinite(chainId)) {
    throw new Error('Invalid chainId for wallet_switchEthereumChain');
  }
  return chainId;
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

    try {
      const result = await MiniKit.walletAuth({
        nonce: crypto.randomUUID().replace(/-/g, ''),
        statement: 'Sign in with World App',
      });

      const addr = result.data.address as `0x${string}`;
      _setAddress(addr);
      emit('accountsChanged', [addr]);
      return [addr];
    } catch (e: any) {
      throw rpcError(4001, `World App wallet auth failed: ${e.message}`);
    }
  }

  return {
    async request({ method, params }: { method: string; params?: unknown }) {
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
          const message = extractPersonalSignMessage(params);
          try {
            const result = await MiniKit.signMessage({ message });
            return result.data.signature;
          } catch (e: any) {
            throw rpcError(4001, `Sign message failed: ${e.message}`);
          }
        }

        case 'eth_sign': {
          const message = extractEthSignMessage(params);
          try {
            const result = await MiniKit.signMessage({ message });
            return result.data.signature;
          } catch (e: any) {
            throw rpcError(4001, `Sign message failed: ${e.message}`);
          }
        }

        case 'eth_signTypedData':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4': {
          try {
            const typedData = parseTypedDataInput(params);
            const result = await MiniKit.signTypedData({
              types: typedData.types as any,
              primaryType: typedData.primaryType as any,
              domain: typedData.domain as any,
              message: typedData.message as any,
              chainId: typedData.chainId,
            });
            if (result.data.status === 'error') {
              throw rpcError(
                4001,
                `Sign typed data failed: ${result.data.error_code}`,
              );
            }
            return result.data.signature;
          } catch (e: any) {
            throw rpcError(4001, `Sign typed data failed: ${e.message}`);
          }
        }

        case 'eth_sendTransaction': {
          const tx = extractTransactionParams(params);

          try {
            const result = await MiniKit.sendTransaction({
              ...(tx.chainId !== undefined ? { chainId: tx.chainId } : {}),
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
          } catch (e: any) {
            throw rpcError(4001, `Send transaction failed: ${e.message}`);
          }
        }

        case 'wallet_switchEthereumChain': {
          const chainId = extractSwitchChainId(params);
          if (chainId !== 480) {
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
