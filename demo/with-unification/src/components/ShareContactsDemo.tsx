'use client';

import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useEnvironment } from '@/providers';
import { Card } from './Card';
import { ResultDisplay } from './ResultDisplay';

/**
 * Demonstrates shareContacts across environments.
 *
 * In World App: native contact picker
 * On web: requires a custom fallback (e.g. manual address input)
 */
export function ShareContactsDemo() {
  const env = useEnvironment();
  const [status, setStatus] = useState<'idle' | 'pending'>('idle');
  const [result, setResult] = useState<{
    via?: string;
    data?: unknown;
    error?: string;
  }>({});

  const handleShareContacts = async () => {
    setStatus('pending');
    setResult({});

    try {
      const contactsResult = await MiniKit.shareContacts({
        isMultiSelectEnabled: true,
        // Fallback for web — REQUIRED outside World App
        fallback: async () => {
          // Simulate a web address book / manual input
          await new Promise((r) => setTimeout(r, 500));
          return {
            contacts: [
              {
                username: 'web-user',
                walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
                profilePictureUrl: null,
              },
            ],
            timestamp: new Date().toISOString(),
          };
        },
      });

      setResult({
        via: contactsResult.via,
        data: contactsResult.data,
      });
    } catch (err: unknown) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setStatus('idle');
    }
  };

  return (
    <Card
      title="Share Contacts (Native + Fallback)"
      description="Native contact picker in World App. On web, the fallback provides mock contacts."
    >
      <button
        onClick={handleShareContacts}
        disabled={status === 'pending'}
        className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
      >
        {status === 'pending' ? 'Loading...' : 'Pick Contacts'}
      </button>

      <p className="text-xs text-muted">
        {env === 'world-app'
          ? 'Will open native World App contact picker'
          : 'Will use the custom fallback (mock contacts)'}
      </p>

      <ResultDisplay via={result.via} data={result.data} error={result.error} />
    </Card>
  );
}
