'use client';

import { EnvironmentBanner } from '@/components/EnvironmentBanner';
import { WagmiNativeDemo } from '@/components/WagmiNativeDemo';
import { UnifiedApiDemo } from '@/components/UnifiedApiDemo';

/**
 * Unified MiniKit Demo — Bidirectional
 *
 * Section 1: Wagmi App → World App
 *   A standard wagmi app with worldApp() connector. Pure wagmi hooks,
 *   zero MiniKit API calls. "Just works" in World App.
 *
 * Section 2: Mini App → Web
 *   MiniKit unified API (request, walletAuth, sendTransaction) with
 *   automatic wagmi fallback on web. No code changes needed.
 */
export default function Home() {
  return (
    <div className="min-h-dvh p-4 pb-12 max-w-lg mx-auto space-y-6">
      <header className="pt-4 pb-2">
        <h1 className="text-2xl font-bold">Unified MiniKit Demo</h1>
        <p className="text-sm text-muted mt-1">
          Bidirectional: wagmi apps work in World App, MiniKit apps work on web.
        </p>
      </header>

      <EnvironmentBanner />

      {/* Direction 1: Wagmi → World App */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">1. Wagmi App &rarr; World App</h2>
          <p className="text-sm text-muted">
            Standard wagmi hooks route through native MiniKit via the{' '}
            <code>worldApp()</code> connector.
          </p>
        </div>
        <WagmiNativeDemo />
      </section>

      {/* Direction 2: MiniKit → Web */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">2. Mini App &rarr; Web</h2>
          <p className="text-sm text-muted">
            Unified MiniKit API falls back to wagmi / IDKit on web automatically.
          </p>
        </div>
        <UnifiedApiDemo />
      </section>

      <footer className="text-center text-xs text-muted pt-4 border-t border-border">
        <p>
          Open in World App to see native transports.
          <br />
          Open in a browser to see wagmi and IDKit fallbacks.
        </p>
      </footer>
    </div>
  );
}
