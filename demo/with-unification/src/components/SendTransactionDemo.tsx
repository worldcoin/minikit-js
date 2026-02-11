'use client';

import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useSendTransaction, useAccount, useConnect } from 'wagmi';
import { parseEther } from 'viem';
import { Card } from './Card';
import { ResultDisplay } from './ResultDisplay';

// Minimal ERC-20 ABI for the demo
const MINT_ABI = [
  {
    name: 'mintToken',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

// Test contract on World Chain
const TEST_CONTRACT = '0xF0882554ee924278806d708396F1a7975b732522';

/**
 * Demonstrates sendTransaction across environments.
 *
 * In World App: batch transactions + permit2 + gas sponsorship
 * On web with Wagmi: sequential execution, no permit2, user pays gas
 */
export function SendTransactionDemo() {
  const [status, setStatus] = useState<'idle' | 'pending'>('idle');
  const [result, setResult] = useState<{
    via?: string;
    data?: unknown;
    error?: string;
  }>({});

  // Wagmi hooks for the direct demo
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { sendTransactionAsync } = useSendTransaction();

  // Unified sendTransaction — auto-detects environment
  const handleUnified = async () => {
    setStatus('pending');
    setResult({});

    try {
      const txResult = await MiniKit.sendTransaction({
        transaction: [
          {
            address: TEST_CONTRACT,
            abi: MINT_ABI,
            functionName: 'mintToken',
            args: [],
          },
        ],
      });

      setResult({
        via: txResult.via,
        data: {
          hashes: txResult.data.hashes,
          transactionId: txResult.data.transactionId,
          features:
            txResult.via === 'minikit'
              ? 'batch + permit2 + gas sponsorship'
              : 'sequential, user pays gas',
        },
      });
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setStatus('idle');
    }
  };

  // Direct Wagmi sendTransaction — web-only path
  const handleDirectWagmi = async () => {
    setStatus('pending');
    setResult({});

    try {
      if (!isConnected) {
        const connector = connectors[0];
        if (!connector) throw new Error('No connectors available');
        await connectAsync({ connector });
      }

      // Self-transfer of 0 ETH as a simple test
      const hash = await sendTransactionAsync({
        to: TEST_CONTRACT,
        value: parseEther('0'),
      });

      setResult({
        via: 'wagmi (direct)',
        data: { hash },
      });
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setStatus('idle');
    }
  };

  return (
    <Card
      title="Send Transaction"
      description="World App: batch + permit2 + gas sponsorship. Web: sequential via Wagmi, user pays gas."
    >
      <div className="flex gap-2">
        <button
          onClick={handleUnified}
          disabled={status === 'pending'}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
        >
          {status === 'pending' ? 'Sending...' : 'Unified Send'}
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
        Unified: <code>MiniKit.sendTransaction(opts)</code>
        <br />
        Direct: Wagmi <code>useSendTransaction</code> hook
      </p>

      <ResultDisplay via={result.via} data={result.data} error={result.error} />
    </Card>
  );
}
