'use client';

import { useState } from 'react';
import { MiniKit, orbLegacy } from '@worldcoin/minikit-js';
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

/**
 * Direction 2: Unified MiniKit API → Works Everywhere
 *
 * Uses MiniKit.request(), MiniKit.walletAuth(), MiniKit.sendTransaction().
 * In World App: native postMessage. On web: wagmi fallback / IDKit bridge.
 * Each result shows a `via` badge indicating which transport was used.
 */
export function UnifiedApiDemo() {
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'pending'>('idle');
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

  // IDKit Verify
  const handleVerify = async () => {
    setVerifyStatus('pending');
    setVerifyResult({});
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
      setVerifyResult({
        via: request.connectorURI ? 'idkit-bridge' : 'native',
        data: completion,
      });
    } catch (err: unknown) {
      setVerifyResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setVerifyStatus('idle');
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
      setAuthResult({ error: err instanceof Error ? err.message : String(err) });
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
            disabled={verifyStatus === 'pending'}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
          >
            {verifyStatus === 'pending' ? 'Verifying...' : 'Verify with World ID'}
          </button>
          <p className="text-xs text-muted mt-1">
            <code>MiniKit.request(config).preset(orbLegacy(...))</code>
          </p>
          <ResultDisplay via={verifyResult.via} data={verifyResult.data} error={verifyResult.error} />
        </div>

        {/* Wallet Auth */}
        <div>
          <button
            onClick={handleAuth}
            disabled={authStatus === 'pending'}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
          >
            {authStatus === 'pending' ? 'Authenticating...' : 'Connect & Sign (SIWE)'}
          </button>
          <p className="text-xs text-muted mt-1">
            <code>MiniKit.walletAuth(opts)</code>
          </p>
          <ResultDisplay via={authResult.via} data={authResult.data} error={authResult.error} />
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
          <ResultDisplay via={txResult.via} data={txResult.data} error={txResult.error} />
        </div>
      </div>

      <p className="text-xs text-muted border-t border-border pt-3">
        In World App: native postMessage transport.
        <br />
        On web: wagmi fallback (walletAuth, sendTx) / IDKit bridge (verify).
      </p>
    </Card>
  );
}
