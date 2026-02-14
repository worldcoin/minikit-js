'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import {
  IDKitRequestWidget,
  orbLegacy,
  type IDKitResult,
  type RpContext,
} from '@worldcoin/idkit';
import { useState } from 'react';
import { Card } from './Card';
import { ResultDisplay } from './ResultDisplay';

// Minimal ABI for demo transaction
const MINT_ABI = [
  {
    name: 'mintToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

const TEST_CONTRACT = '0xF0882554ee924278806d708396F1a7975b732522';

const APP_ID = (process.env.NEXT_PUBLIC_APP_ID ??
  'app_staging_xxx') as `app_${string}`;
const RP_ID = process.env.NEXT_PUBLIC_RP_ID ?? 'rp_765bb8d478f75a03';
const ACTION = 'test-action';

/**
 * Direction 2: Unified MiniKit API → Works Everywhere
 *
 * Uses IDKitRequestWidget for verify (handles native + web automatically),
 * MiniKit.walletAuth() and MiniKit.sendTransaction() with wagmi fallback.
 * Each result shows a `via` badge indicating which transport was used.
 */
export function UnifiedApiDemo() {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    via?: string;
    data?: unknown;
    error?: string;
  }>({});

  const [authStatus, setAuthStatus] = useState<'idle' | 'pending'>('idle');
  const [authResult, setAuthResult] = useState<{
    via?: string;
    data?: unknown;
    error?: string;
  }>({});

  const [txStatus, setTxStatus] = useState<'idle' | 'pending'>('idle');
  const [txResult, setTxResult] = useState<{
    via?: string;
    data?: unknown;
    error?: string;
  }>({});

  // IDKit Verify — fetch RP signature then open widget
  const handleVerify = async () => {
    setVerifyResult({});
    try {
      const res = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: ACTION }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `RP signature request failed (${res.status})`);
      }

      const rpSig = await res.json();

      setRpContext({
        rp_id: RP_ID,
        nonce: rpSig.nonce,
        created_at: rpSig.created_at,
        expires_at: rpSig.expires_at,
        signature: rpSig.sig,
      });
      setWidgetOpen(true);
    } catch (err: unknown) {
      setVerifyResult({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // Wallet Auth (SIWE)
  const handleAuth = async () => {
    setAuthStatus('pending');
    setAuthResult({});
    try {
      const result = await MiniKit.walletAuth({
        nonce: crypto.randomUUID(),
        statement: 'Sign in to Unified Demo',
      });
      setAuthResult({
        via: result.via,
        data: {
          address: result.data.address,
          message: result.data.message.slice(0, 100) + '...',
          signature: result.data.signature.slice(0, 20) + '...',
        },
      });
    } catch (err: unknown) {
      setAuthResult({
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setAuthStatus('idle');
    }
  };

  // Send Transaction
  const handleSendTx = async () => {
    setTxStatus('pending');
    setTxResult({});
    try {
      const result = await MiniKit.sendTransaction({
        transaction: [
          {
            address: TEST_CONTRACT,
            abi: MINT_ABI,
            functionName: 'mintToken',
            args: [],
          },
        ],
      });
      setTxResult({
        via: result.via,
        data: {
          hashes: result.data.hashes,
          transactionId: result.data.transactionId,
          features:
            result.via === 'minikit'
              ? 'batch + permit2 + gas sponsorship'
              : 'sequential, user pays gas',
        },
      });
    } catch (err: unknown) {
      setTxResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setTxStatus('idle');
    }
  };

  return (
    <Card
      title="Unified MiniKit API"
      description="Same code, any environment. In World App: native postMessage. On web: wagmi fallback / IDKit bridge."
    >
      <div className="space-y-4">
        {/* Verify */}
        <div>
          <button
            onClick={handleVerify}
            disabled={widgetOpen}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
          >
            {widgetOpen ? 'Verifying...' : 'Verify with World ID'}
          </button>
          <p className="text-xs text-muted mt-1">
            <code>IDKitRequestWidget</code> — native in World App, QR on web
          </p>
          <ResultDisplay
            via={verifyResult.via}
            data={verifyResult.data}
            error={verifyResult.error}
          />
        </div>

        {/* Wallet Auth */}
        <div>
          <button
            onClick={handleAuth}
            disabled={authStatus === 'pending'}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
          >
            {authStatus === 'pending'
              ? 'Authenticating...'
              : 'Connect & Sign (SIWE)'}
          </button>
          <p className="text-xs text-muted mt-1">
            <code>MiniKit.walletAuth(opts)</code>
          </p>
          <ResultDisplay
            via={authResult.via}
            data={authResult.data}
            error={authResult.error}
          />
        </div>

        {/* Send Transaction */}
        <div>
          <button
            onClick={handleSendTx}
            disabled={txStatus === 'pending'}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
          >
            {txStatus === 'pending' ? 'Sending...' : 'Send Transaction'}
          </button>
          <p className="text-xs text-muted mt-1">
            <code>MiniKit.sendTransaction(opts)</code>
          </p>
          <ResultDisplay
            via={txResult.via}
            data={txResult.data}
            error={txResult.error}
          />
        </div>
      </div>

      <p className="text-xs text-muted border-t border-border pt-3">
        In World App: native postMessage transport.
        <br />
        On web: wagmi fallback (walletAuth, sendTx) / IDKit widget (verify).
      </p>

      {rpContext && (
        <IDKitRequestWidget
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          app_id={APP_ID}
          action={ACTION}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy({ signal: 'demo-signal' })}
          onSuccess={(result: IDKitResult) => {
            setVerifyResult({ via: 'idkit', data: result });
          }}
          onError={(errorCode) => {
            setVerifyResult({ error: `Verification failed: ${errorCode}` });
          }}
        />
      )}
    </Card>
  );
}
