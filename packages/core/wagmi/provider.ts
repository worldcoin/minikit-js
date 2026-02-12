/**
 * EIP-1193 Provider Shim for World App
 *
 * Routes standard JSON-RPC methods to MiniKit's native async commands,
 * allowing wagmi hooks (useSignMessage, useSendTransaction, etc.) to work
 * transparently inside World App.
 */

import { MiniKit } from '../minikit';

export type WorldAppProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, fn: (...args: unknown[]) => void) => void;
  removeListener: (event: string, fn: (...args: unknown[]) => void) => void;
};

function rpcError(code: number, message: string) {
  return Object.assign(new Error(message), { code });
}

export function createWorldAppProvider(
  getAddress: () => `0x${string}` | undefined,
): WorldAppProvider {
  const listeners: Record<string, Set<(...args: unknown[]) => void>> = {};

  return {
    async request({ method, params }: { method: string; params?: unknown[] }) {
      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts': {
          const addr = getAddress();
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

          // World App only supports ABI-typed transactions.
          // Raw calldata cannot be decoded back to ABI format.
          if (tx.data && tx.data !== '0x') {
            throw rpcError(
              4200,
              'World App does not support raw calldata via eth_sendTransaction. ' +
                'Use MiniKit.sendTransaction() for contract interactions.',
            );
          }

          // Simple value transfer (no contract call)
          const { finalPayload } =
            await MiniKit.commandsAsync.sendTransaction({
              transaction: [
                {
                  address: tx.to as `0x${string}`,
                  abi: [],
                  functionName: '',
                  args: [],
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
