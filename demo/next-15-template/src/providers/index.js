'use client';
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { SessionProvider } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { jsx as _jsx } from 'react/jsx-runtime';
const ErudaProvider = dynamic(
  () => import('@/providers/Eruda').then((c) => c.ErudaProvider),
  { ssr: false },
);
/**
 * ClientProvider wraps the app with essential context providers.
 *
 * - ErudaProvider:
 *     - Should be used only in development.
 *     - Enables an in-browser console for logging and debugging.
 *
 * - MiniKitProvider:
 *     - Required for MiniKit functionality.
 *
 * This component ensures both providers are available to all child components.
 */
export default function ClientProviders({ children, session }) {
  return _jsx(ErudaProvider, {
    children: _jsx(MiniKitProvider, {
      children: _jsx(SessionProvider, { session: session, children: children }),
    }),
  });
}
