import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';

export const client = createPublicClient({
  chain: worldchain,
  transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
});
