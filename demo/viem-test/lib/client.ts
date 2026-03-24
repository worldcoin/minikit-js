import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { worldchain } from 'viem/chains';
import { getWorldAppProvider } from '@worldcoin/minikit-js';

export function getWalletClient() {
  const provider =
    typeof window !== 'undefined' && (window as any).__minikit_provider
      ? getWorldAppProvider()
      : typeof window !== 'undefined' && (window as any).ethereum
        ? (window as any).ethereum
        : getWorldAppProvider();

  return createWalletClient({
    chain: worldchain,
    transport: custom(provider),
  });
}

export const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(),
});
