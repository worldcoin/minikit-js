import { worldApp } from '@worldcoin/minikit-js/wagmi';
import { createConfig, http } from 'wagmi';
import { worldchain } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
export const config = createConfig({
  chains: [worldchain],
  connectors: [worldApp(), injected()],
  transports: {
    [worldchain.id]: http(),
  },
});
