'use client';

import { useState } from 'react';
import { MiniKit, orbLegacy, VerificationLevel } from '@worldcoin/minikit-js';
import { Card } from './Card';
import { ResultDisplay } from './ResultDisplay';

/**
 * Demonstrates the new IDKit-based verification via MiniKit.request() builder.
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

  const handleVerifyPreset = async () => {
    setStatus('pending');
    setResult({});

    try {
      // New builder pattern: MiniKit.request(config).preset(...)
      // In World App: native postMessage, no QR
      // On web: IDKit bridge with QR code and polling
      const request = await MiniKit.request({
        app_id: (process.env.NEXT_PUBLIC_APP_ID ?? 'app_staging_xxx') as `app_${string}`,
        action: 'test-action',
        // rp_context is required for web (bridge) verification
        // In World App, it's optional
        rp_context: {
          rp_id: typeof window !== 'undefined' ? window.location.host : 'localhost',
          nonce: crypto.randomUUID(),
          created_at: Math.floor(Date.now() / 1000),
          expires_at: Math.floor(Date.now() / 1000) + 300,
          signature: '',
        },
        allow_legacy_proofs: true,
      }).preset(orbLegacy({ signal: 'demo-signal' }));

      // If on web, request.connectorURI has the QR code URL
      if (request.connectorURI) {
        console.log('QR URL (display to user):', request.connectorURI);
      }

      // Wait for the verification result
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

  const handleVerifyLegacy = async () => {
    setStatus('pending');
    setResult({});

    try {
      // Legacy MiniKit.commandsAsync.verify still works
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: 'test-action',
        verification_level: VerificationLevel.Orb,
      });

      setResult({
        via: 'minikit-legacy',
        data: finalPayload,
      });
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setStatus('idle');
    }
  };

  return (
    <Card
      title="Verify (IDKit Builder)"
      description="MiniKit.request() uses the IDKit builder pattern. Native postMessage in World App, QR + polling on web."
    >
      <div className="flex gap-2">
        <button
          onClick={handleVerifyPreset}
          disabled={status === 'pending'}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
        >
          {status === 'pending' ? 'Verifying...' : 'Verify (Builder)'}
        </button>
        <button
          onClick={handleVerifyLegacy}
          disabled={status === 'pending'}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50"
        >
          Verify (Legacy)
        </button>
      </div>

      <p className="text-xs text-muted">
        Builder: <code>MiniKit.request(config).preset(orbLegacy(...))</code>
        <br />
        Legacy: <code>MiniKit.commandsAsync.verify(...)</code>
      </p>

      <ResultDisplay via={result.via} data={result.data} error={result.error} />
    </Card>
  );
}
