import { createConfig, http } from '@wagmi/core';
import { mainnet, optimism, sepolia } from '@wagmi/core/chains';

export const config = createConfig({
  chains: [mainnet, sepolia, optimism],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [optimism.id]: http(),
  },
});
