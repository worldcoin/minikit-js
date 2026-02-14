'use client';
import { MiniKitProvider } from '@worldcoin/minikit-js';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
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

export default function ClientProviders({
  children,
  session,
}: ClientProvidersProps) {
  return (
    <ErudaProvider>
      <MiniKitProvider>
        <SessionProvider session={session}>{children}</SessionProvider>
      </MiniKitProvider>
    </ErudaProvider>
  );
}
