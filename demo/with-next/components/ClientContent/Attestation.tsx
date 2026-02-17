import {
  AttestationInput,
  MiniAppAttestationPayload,
  MiniKit,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Compute hex-encoded SHA-256 hash of a string using the Web Crypto API.
 */
async function hexSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
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
  const [response, setResponse] = useState<Record<string, any> | null>(null);
  const [backendResult, setBackendResult] = useState<Record<
    string,
    any
  > | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBody, setCurrentBody] = useState<string>('');

  // Keep the current request body in a ref so the subscription callback
  // always has access to the body that matches the in-flight attestation.
  const requestBodyRef = useRef<string>('');

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppAttestation,
      async (payload: MiniAppAttestationPayload) => {
        console.log('MiniAppAttestation, SUBSCRIBE PAYLOAD', payload);
        setResponse(payload);

        if (payload.status === 'success') {
          // Step 3: Send request + token to backend; backend hashes body independently
          await verifyOnBackend(payload.token, requestBodyRef.current);
        } else {
          setIsLoading(false);
        }
      },
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppAttestation);
    };
  }, []);

  const verifyOnBackend = async (token: string, body: string) => {
    try {
      const res = await fetch('/api/verify-attestation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Attestation-Token': token,
        },
        body,
      });
      const data = await res.json();
      setBackendResult(data);
    } catch (error) {
      setBackendResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Fetch failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRequestAttestation = useCallback(async () => {
    setResponse(null);
    setBackendResult(null);
    setIsLoading(true);

    // Step 1: Build a unique request body and hash it
    const body = buildRequestBody();
    requestBodyRef.current = body;
    setCurrentBody(body);
    const requestHash = await hexSha256(body);

    // Step 2: Request attestation token from World App
    const attestationPayload: AttestationInput = { requestHash };
    const sent = MiniKit.commands.attestation(attestationPayload);

    if (!sent) {
      setResponse({ status: 'error', message: 'Command dispatch failed' });
      setIsLoading(false);
    }
  }, []);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Attestation</h2>

        {currentBody && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Request body:</p>
            <div className="bg-gray-200 p-2 rounded text-xs">
              <pre className="break-all whitespace-break-spaces">
                {currentBody}
              </pre>
            </div>
          </div>
        )}

        {response && (
          <div>
            <p className="text-sm font-semibold">Attestation response:</p>
            <div className="bg-gray-300 min-h-[60px] p-2">
              <pre className="break-all whitespace-break-spaces max-h-[200px] overflow-y-scroll text-xs">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {backendResult && (
          <div>
            <p className="text-sm font-semibold">Backend verification:</p>
            <div
              className={`min-h-[60px] p-2 ${backendResult.status === 'success' ? 'bg-green-200' : 'bg-red-200'}`}
            >
              <pre className="break-all whitespace-break-spaces max-h-[200px] overflow-y-scroll text-xs">
                {JSON.stringify(backendResult, null, 2)}
              </pre>
            </div>
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
    </div>
  );
};
