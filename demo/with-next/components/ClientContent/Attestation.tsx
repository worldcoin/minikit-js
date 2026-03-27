'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { useState } from 'react';

async function hexSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function buildRequestBody(): string {
  return JSON.stringify({
    action: 'transfer',
    to: '0x1234...abcd',
    amount: '1.0',
    token: 'WLD',
    nonce: crypto.randomUUID(),
  });
}

export const Attestation = () => {
  const [requestBody, setRequestBody] = useState<string>('');
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onRequestAttestation = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const body = buildRequestBody();
      setRequestBody(body);

      const requestHash = await hexSha256(body);
      const attestationResult = await MiniKit.attestation({ requestHash });
      setResult(attestationResult);
    } catch (error) {
      setResult({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Attestation</h2>

      {requestBody && (
        <div className="bg-gray-200 p-2 rounded text-xs">
          <pre className="break-all whitespace-break-spaces">{requestBody}</pre>
        </div>
      )}

      {result && (
        <div className="bg-gray-300 min-h-[60px] p-2">
          <pre className="break-all whitespace-break-spaces max-h-[200px] overflow-y-scroll text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <button
        className="bg-black text-white rounded-lg p-4 w-full disabled:opacity-50"
        onClick={onRequestAttestation}
        disabled={isLoading}
      >
        {isLoading ? 'Requesting...' : 'Request Attestation'}
      </button>
    </div>
  );
};
