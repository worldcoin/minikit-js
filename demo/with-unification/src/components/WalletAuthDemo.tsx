'use client';

import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { Card } from './Card';
import { ResultDisplay } from './ResultDisplay';

/**
 * Demonstrates walletAuth across environments.
 *
 * In World App: native SIWE via postMessage
 * On web with Wagmi: connect wallet + SIWE via Wagmi
 * Fallback: custom implementation
 *
 * The unified API returns { data, via } so you always know which path was used.
 */
export function WalletAuthDemo() {
  const [status, setStatus] = useState<'idle' | 'pending'>('idle');
  const [result, setResult] = useState<{
    via?: string;
    data?: unknown;
    error?: string;
  }>({});

  // Wagmi hooks for the direct-wagmi demo
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();

  // Unified walletAuth — auto-detects environment
  const handleUnifiedAuth = async () => {
    setStatus('pending');
    setResult({});

    try {
      const authResult = await MiniKit.walletAuth({
        nonce: crypto.randomUUID(),
        statement: 'Sign in to Unified Demo',
      });

      setResult({
        via: authResult.via,
        data: {
          address: authResult.data.address,
          message: authResult.data.message.slice(0, 100) + '...',
          signature: authResult.data.signature.slice(0, 20) + '...',
        },
      });
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setStatus('idle');
    }
  };

  // Direct Wagmi wallet auth — demonstrates web-only path
  const handleDirectWagmi = async () => {
    setStatus('pending');
    setResult({});

    try {
      let userAddress = address;

      if (!isConnected) {
        const connector = connectors[0];
        if (!connector) throw new Error('No connectors available');
        const result = await connectAsync({ connector });
        userAddress = result.accounts[0];
      }

      if (!userAddress) throw new Error('No address after connect');

      const nonce = crypto.randomUUID();
      const message = [
        `${window.location.host} wants you to sign in with your Ethereum account:`,
        userAddress,
        '',
        'Sign in to Unified Demo',
        '',
        `URI: ${window.location.origin}`,
        'Version: 1',
        'Chain ID: 480',
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join('\n');

      const signature = await signMessageAsync({ message });

      setResult({
        via: 'wagmi (direct)',
        data: {
          address: userAddress,
          message: message.slice(0, 100) + '...',
          signature: signature.slice(0, 20) + '...',
        },
      });
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setStatus('idle');
    }
  };

  return (
    <Card
      title="Wallet Auth (SIWE)"
      description="MiniKit.walletAuth() uses native SIWE in World App, Wagmi on web. Returns { data, via } to show which path ran."
    >
      <div className="flex gap-2">
        <button
          onClick={handleUnifiedAuth}
          disabled={status === 'pending'}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
        >
          {status === 'pending' ? 'Authenticating...' : 'Unified Auth'}
        </button>
        <button
          onClick={handleDirectWagmi}
          disabled={status === 'pending'}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50"
        >
          Direct Wagmi
        </button>
      </div>

      <p className="text-xs text-muted">
        Unified: <code>MiniKit.walletAuth(opts)</code> &mdash; auto-detects
        <br />
        Direct: Wagmi <code>useConnect + useSignMessage</code> hooks
      </p>

      <ResultDisplay via={result.via} data={result.data} error={result.error} />
    </Card>
  );
}
