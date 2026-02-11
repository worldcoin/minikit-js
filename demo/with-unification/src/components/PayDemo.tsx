'use client';

import { useState } from 'react';
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js';
import { useEnvironment } from '@/providers';
import { Card } from './Card';
import { ResultDisplay } from './ResultDisplay';

/**
 * Demonstrates pay across environments.
 *
 * In World App: native payment flow with token picker
 * On web: requires a custom fallback (e.g. Stripe, manual transfer)
 *
 * The `fallback` option is REQUIRED on web — without it, the SDK throws
 * FallbackRequiredError to prevent silent failures.
 */
export function PayDemo() {
  const env = useEnvironment();
  const [status, setStatus] = useState<'idle' | 'pending'>('idle');
  const [result, setResult] = useState<{
    via?: string;
    data?: unknown;
    error?: string;
  }>({});

  const handlePay = async () => {
    setStatus('pending');
    setResult({});

    try {
      const payResult = await MiniKit.pay({
        reference: crypto.randomUUID(),
        to: '0x0000000000000000000000000000000000000001',
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(0.1, Tokens.WLD).toString(),
          },
        ],
        description: 'Unified demo payment',
        // Fallback for web — this is REQUIRED outside World App
        fallback: async () => {
          // Simulate a web payment flow (Stripe, bank transfer, etc.)
          await new Promise((r) => setTimeout(r, 1000));
          return {
            transactionId: 'web-fallback-' + Date.now(),
            reference: 'web-ref',
            from: '0x0000000000000000000000000000000000000000',
            chain: Network.WorldChain,
            timestamp: new Date().toISOString(),
          };
        },
      });

      setResult({
        via: payResult.via,
        data: payResult.data,
      });
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setStatus('idle');
    }
  };

  return (
    <Card
      title="Pay (Native + Fallback)"
      description="Native payment in World App. On web, the fallback runs (e.g. Stripe). Without fallback, throws FallbackRequiredError."
    >
      <button
        onClick={handlePay}
        disabled={status === 'pending'}
        className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
      >
        {status === 'pending' ? 'Processing...' : 'Pay 0.1 WLD'}
      </button>

      <p className="text-xs text-muted">
        {env === 'world-app'
          ? 'Will use native World App payment flow'
          : 'Will use the custom fallback (simulated web payment)'}
      </p>

      <ResultDisplay via={result.via} data={result.data} error={result.error} />
    </Card>
  );
}
