'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniKitProvider } from '@worldcoin/minikit-js/provider';
import dynamic from 'next/dynamic';
import { jsx as _jsx } from 'react/jsx-runtime';
import { WagmiProvider } from 'wagmi';
import { config } from '../config'; // Import the wagmiConfig from the correct path
import SessionProvider from './SessionProvider'; // Assuming SessionProvider is also client-side or compatible
const ErudaProvider = dynamic(
  () => import('./ClientContent/Eruda').then((c) => c.ErudaProvider),
  { ssr: false },
);
const queryClient = new QueryClient();
export default function ClientProviders({ children, session }) {
  return _jsx(WagmiProvider, {
    config: config,
    children: _jsx(QueryClientProvider, {
      client: queryClient,
      children: _jsx(ErudaProvider, {
        children: _jsx(MiniKitProvider, {
          props: {
            appId: process.env.NEXT_PUBLIC_APP_ID ?? '',
            wagmiConfig: config,
          },
          children: _jsx(SessionProvider, {
            session: session,
            children: children,
          }),
        }),
      }),
    }),
  });
}
