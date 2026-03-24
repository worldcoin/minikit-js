'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniKitProvider } from '@worldcoin/minikit-js/provider';
import { ReactNode, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { ErudaProvider } from './Eruda';
import { config } from '@/lib/wagmi-config';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MiniKitProvider
          props={{
            appId: process.env.NEXT_PUBLIC_APP_ID ?? '',
            wagmiConfig: config,
          }}
        >
          <ErudaProvider>{children}</ErudaProvider>
        </MiniKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
