'use client';

import { useState } from 'react';
import { MiniKit, orbLegacy } from '@worldcoin/minikit-js';
import { Card } from './Card';
import { ResultDisplay } from './ResultDisplay';

/**
 * Demonstrates IDKit-based verification via MiniKit.request() builder.
 *
 * In World App: uses native postMessage transport
 * On web: uses IDKit bridge (QR code + polling)
 *
 * Both paths go through the same builder API:
 *   MiniKit.request(config).preset(orbLegacy({ signal }))
 */
export function VerifyDemo() {
  const [status, setStatus] = useState<'idle' | 'pending'>('idle');
  const [result, setResult] = useState<{
    via?: string;
    data?: unknown;
    error?: string;
  }>({});

  const handleVerify = async () => {
    setStatus('pending');
    setResult({});

    try {
      const request = await MiniKit.request({
        app_id: (process.env.NEXT_PUBLIC_APP_ID ?? 'app_staging_xxx') as `app_${string}`,
        action: 'test-action',
        rp_context: {
          rp_id: typeof window !== 'undefined' ? window.location.host : 'localhost',
          nonce: crypto.randomUUID(),
          created_at: Math.floor(Date.now() / 1000),
          expires_at: Math.floor(Date.now() / 1000) + 300,
          signature: '',
        },
        allow_legacy_proofs: true,
      }).preset(orbLegacy({ signal: 'demo-signal' }));

      if (request.connectorURI) {
        console.log('QR URL (display to user):', request.connectorURI);
      }

      const completion = await request.pollUntilCompletion();

      setResult({
        via: request.connectorURI ? 'idkit-bridge' : 'native',
        data: completion,
      });
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setStatus('idle');
    }
  };

  return (
    <Card
      title="Verify"
      description="MiniKit.request() uses the IDKit builder pattern. Native postMessage in World App, QR + polling on web."
    >
      <button
        onClick={handleVerify}
        disabled={status === 'pending'}
        className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
      >
        {status === 'pending' ? 'Verifying...' : 'Verify'}
      </button>

      <p className="text-xs text-muted">
        <code>MiniKit.request(config).preset(orbLegacy(...))</code>
      </p>

      <ResultDisplay via={result.via} data={result.data} error={result.error} />
    </Card>
  );
}
