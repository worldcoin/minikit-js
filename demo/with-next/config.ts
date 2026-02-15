import { worldApp } from '@worldcoin/minikit-js/wagmi';
import { type Config, createConfig, http } from 'wagmi';
import { worldchain } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config: Config = createConfig({
  chains: [worldchain],
  connectors: [worldApp(), injected()],
  transports: {
    [worldchain.id]: http(),
  },
});
