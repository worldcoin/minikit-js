'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniKitProvider } from '@worldcoin/minikit-js/provider';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { config } from '../config'; // Import the wagmiConfig from the correct path
import SessionProvider from './SessionProvider'; // Assuming SessionProvider is also client-side or compatible

const ErudaProvider = dynamic(
  () => import('./ClientContent/Eruda').then((c) => c.ErudaProvider),
  { ssr: false },
);

// Define props for ClientProviders
interface ClientProvidersProps {
  children: ReactNode;
  session: any; // Use the appropriate type for session from next-auth
}

const queryClient = new QueryClient();

export default function ClientProviders({
  children,
  session,
}: ClientProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ErudaProvider>
          <MiniKitProvider>
            <SessionProvider session={session}>{children}</SessionProvider>
          </MiniKitProvider>
        </ErudaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
