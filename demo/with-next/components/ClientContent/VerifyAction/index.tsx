import { MiniKit, orbLegacy, type RpContext } from '@worldcoin/minikit-js';
import { clsx } from 'clsx';
import { useCallback, useState } from 'react';
import { verifyProof } from './verify-cloud-proof';
import { VerifyOnchainProof } from './verify-onchain';

export const VerifyAction = () => {
  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';

  const [verifyResult, setVerifyResult] = useState<Record<string, any> | undefined>();
  const [sentVerifyPayload, setSentVerifyPayload] = useState<Record<string, any> | null>(null);
  const [devPortalVerifyResponse, setDevPortalVerifyResponse] = useState<Record<string, any> | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastUsedAppId, setLastUsedAppId] = useState<`app_${string}` | null>(null);

  const verifyAction = useCallback(
    async (params: {
      app_id: `app_${string}`;
      action: string;
      signal?: string;
    }) => {
      const { action, app_id, signal } = params;
      setLastUsedAppId(app_id);

      // Reset fields
      setSentVerifyPayload(null);
      setVerifyResult(undefined);
      setStatusMessage(null);
      setDevPortalVerifyResponse(null);

      try {
        // Fetch RP signature
        const res = await fetch('/api/rp-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });

        if (!res.ok) {
          const text = await res.text();
          setStatusMessage(`RP signature request failed: ${text}`);
          return;
        }

        const rpSig = await res.json();
        const rpContext: RpContext = {
          rp_id: rpSig.rp_id,
          nonce: rpSig.nonce,
          created_at: rpSig.created_at,
          expires_at: rpSig.expires_at,
          signature: rpSig.sig,
        };

        const config = {
          app_id,
          action,
          rp_context: rpContext,
          allow_legacy_proofs: true,
        };

        setSentVerifyPayload(config);

        // Use IDKit request API
        const request = await MiniKit.request(config).preset(
          orbLegacy({ signal: signal ?? '' }),
        );

        setStatusMessage('Waiting for verification...');
        const completion = await request.pollUntilCompletion();
        setVerifyResult(completion as unknown as Record<string, any>);
        setStatusMessage('Verification complete');

        // Verify with dev portal
        const responses = completion.success ? (completion.result as any)?.responses : undefined;
        if (responses && responses.length > 0) {
          const firstResponse = responses[0] as Record<string, any>;
          if (firstResponse.proof) {
            const verifyResponse = await verifyProof({
              payload: {
                proof: firstResponse.proof,
                merkle_root: firstResponse.merkle_root,
                nullifier_hash: firstResponse.nullifier_hash,
                verification_level: firstResponse.verification_level ?? 'orb',
              },
              app_id,
              action,
              signal: signal ?? 'test',
            });
            setDevPortalVerifyResponse(verifyResponse);
          }
        }
      } catch (err: unknown) {
        setStatusMessage(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [],
  );

  const onProdVerifyClick = useCallback(() => {
    verifyAction({
      app_id: process.env.NEXT_PUBLIC_PROD_VERIFY_APP_ID as `app_${string}`,
      action: process.env.NEXT_PUBLIC_PROD_VERIFY_ACTION as string,
      signal: 'test',
    });
  }, [verifyAction]);

  const onStagingVerifyClick = useCallback(() => {
    verifyAction({
      app_id: process.env.NEXT_PUBLIC_STAGING_VERIFY_APP_ID as `app_${string}`,
      action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION as string,
      signal: 'test',
    });
  }, [verifyAction]);

  return (
    <div className="grid gap-y-4">
      <h2 className="font-bold text-2xl">Verify (IDKit)</h2>

      <p className="border p-1 border-gray-400">
        <span className="font-bold block">App ID:</span>
        <span className="text-[12px] break-all">{lastUsedAppId ?? ''}</span>
      </p>

      <div className="grid gap-y-12">
        <div className="grid gap-y-2">
          <div>
            <p>Sent payload:</p>

            <div className="bg-gray-300 min-h-[100px] p-2">
              <pre className="break-all whitespace-break-spaces">
                {JSON.stringify(sentVerifyPayload, null, 2)}
              </pre>
            </div>
          </div>

          <div className="grid gap-y-2">
            <div className="grid grid-cols-2 gap-x-2">
              <button
                className={clsx(
                  'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                  isProduction ? 'hidden' : '',
                )}
                onClick={onStagingVerifyClick}
              >
                Send staging verify (Orb)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-2">
              <button
                className={clsx(
                  'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                  isProduction ? '' : 'hidden',
                )}
                onClick={onProdVerifyClick}
              >
                Send production verify (Orb)
              </button>
            </div>
          </div>
        </div>

        <div className="w-full grid gap-y-2">
          <p>IDKit Verify Result</p>

          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(verifyResult, null, 2) ??
                JSON.stringify(null)}
            </pre>
          </div>

          <div className="grid gap-y-2">
            <p>Status:</p>
            <p className="bg-gray-300 p-2">
              {statusMessage ?? 'No verification yet'}
            </p>
          </div>

          <div className="grid gap-y-2">
            <p>`DEV_PORTAL/api/v2/verify` Response:</p>
            <pre className="break-all whitespace-break-spaces bg-gray-300 p-2">
              {JSON.stringify(devPortalVerifyResponse, null, 2) ??
                'No validation'}
            </pre>
          </div>
        </div>
      </div>
      <VerifyOnchainProof />
    </div>
  );
};
