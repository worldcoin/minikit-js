'use client';

import { isInWorldApp } from '@worldcoin/minikit-js';
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { wagmiConfig } from './wagmi-config';

const queryClient = new QueryClient();

/**
 * Provider setup:
 *
 *   <QueryClientProvider>
 *     <WagmiProvider>
 *       <MiniKitProvider wagmiConfig={wagmiConfig}>
 *         {children}
 *       </MiniKitProvider>
 *     </WagmiProvider>
 *   </QueryClientProvider>
 */
export function Providers({ children }: { children: ReactNode }) {
  const [environment, setEnvironment] = useState<
    'world-app' | 'web' | 'loading'
  >('loading');

  useEffect(() => {
    setEnvironment(isInWorldApp() ? 'world-app' : 'web');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <MiniKitProvider props={{ appId: process.env.NEXT_PUBLIC_APP_ID ?? '' }} wagmiConfig={wagmiConfig}>
          <EnvironmentContext.Provider value={environment}>
            {children}
          </EnvironmentContext.Provider>
        </MiniKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

// Simple context to share detected environment
const EnvironmentContext = createContext<'world-app' | 'web' | 'loading'>(
  'loading',
);

export function useEnvironment() {
  return useContext(EnvironmentContext);
}
