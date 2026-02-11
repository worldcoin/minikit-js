'use client';

import { EnvironmentBanner } from '@/components/EnvironmentBanner';
import { VerifyDemo } from '@/components/VerifyDemo';
import { WalletAuthDemo } from '@/components/WalletAuthDemo';
import { SendTransactionDemo } from '@/components/SendTransactionDemo';
import { PayDemo } from '@/components/PayDemo';
import { ShareContactsDemo } from '@/components/ShareContactsDemo';

/**
 * Unified MiniKit Demo
 *
 * Every command on this page uses the same code regardless of environment.
 * The SDK auto-detects whether it's running in World App or on the web
 * and picks the best transport:
 *
 *   Native (World App) -> Wagmi (web + Wagmi configured) -> Custom Fallback -> Error
 *
 * Each result includes a `via` field showing which path was used.
 */
export default function Home() {
  return (
    <div className="min-h-dvh p-4 pb-12 max-w-lg mx-auto space-y-4">
      <header className="pt-4 pb-2">
        <h1 className="text-2xl font-bold">Unified MiniKit Demo</h1>
        <p className="text-sm text-muted mt-1">
          Same code, any environment. Watch the <code>via</code> badge to see
          which transport path each command used.
        </p>
      </header>

      <EnvironmentBanner />
      <VerifyDemo />
      <WalletAuthDemo />
      <SendTransactionDemo />
      <PayDemo />
      <ShareContactsDemo />

      <footer className="text-center text-xs text-muted pt-4 border-t border-border">
        <p>
          Open this page in World App to see native transports.
          <br />
          Open in a browser to see Wagmi and fallback transports.
        </p>
      </footer>
    </div>
  );
}
