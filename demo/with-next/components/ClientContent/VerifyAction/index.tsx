'use client';
import {
  IDKitRequestWidget,
  deviceLegacy,
  type IDKitResult,
  type RpContext,
} from '@worldcoin/idkit';
import { useMemo, useState } from 'react';
import { verifyProof } from './verify-cloud-proof';
import { VerifyOnchainProof } from './verify-onchain';

export const VerifyAction = () => {
  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';

  const [sentVerifyPayload, setSentVerifyPayload] = useState<Record<
    string,
    any
  > | null>(null);
  const [devPortalVerifyResponse, setDevPortalVerifyResponse] = useState<Record<
    string,
    any
  > | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [widgetSignal, setWidgetSignal] = useState('test');

  const appId = (isProduction
    ? process.env.NEXT_PUBLIC_PROD_VERIFY_APP_ID
    : process.env.NEXT_PUBLIC_STAGING_VERIFY_APP_ID) as `app_${string}`;
  const action = (isProduction
    ? process.env.NEXT_PUBLIC_PROD_VERIFY_ACTION
    : process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION) as string;
  const environment = isProduction ? 'production' : 'staging';

  const preset = useMemo(
    () => deviceLegacy({ signal: widgetSignal }),
    [widgetSignal],
  );

  const startVerify = async () => {
    setSentVerifyPayload(null);
    setStatusMessage(null);
    setDevPortalVerifyResponse(null);

    try {
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
      const rpCtx: RpContext = {
        rp_id: rpSig.rp_id,
        nonce: rpSig.nonce,
        created_at: rpSig.created_at,
        expires_at: rpSig.expires_at,
        signature: rpSig.sig,
      };

      setSentVerifyPayload({
        app_id: appId,
        action,
        rp_context: rpCtx,
        allow_legacy_proofs: true,
      });
      setWidgetSignal(`test-${Date.now()}`);
      setRpContext(rpCtx);
      setStatusMessage('Opening IDKit widget...');
      setWidgetOpen(true);
    } catch (err: unknown) {
      setStatusMessage(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <div className="grid gap-y-4">
      <h2 className="font-bold text-2xl">Verify (IDKit)</h2>
      <p className="border p-1 border-gray-400">
        <span className="font-bold block">App ID:</span>
        <span className="text-[12px] break-all">{appId ?? ''}</span>
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
                className="bg-black text-white rounded-lg p-4 w-full disabled:opacity-20"
                onClick={startVerify}
              >
                {isProduction
                  ? 'Send production verify'
                  : 'Send staging verify'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full grid gap-y-2">
          <div className="grid gap-y-2">
            <p>Status:</p>
            <p className="bg-gray-300 p-2">
              {statusMessage ?? 'No verification yet'}
            </p>
          </div>

          <div className="grid gap-y-2">
            <p>`DEV_PORTAL/api/v4/verify` Response:</p>
            <pre className="break-all whitespace-break-spaces bg-gray-300 p-2">
              {JSON.stringify(devPortalVerifyResponse, null, 2) ??
                'No validation'}
            </pre>
          </div>
        </div>
      </div>

      {rpContext && (
        <IDKitRequestWidget
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          app_id={appId}
          action={action}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={preset}
          onSuccess={() => {
            setStatusMessage('Verification complete');
          }}
          handleVerify={async (result: IDKitResult) => {
            const verifyResponse = await verifyProof(result, appId);
            setDevPortalVerifyResponse(verifyResponse);
            if (verifyResponse?.success) {
              setStatusMessage(
                'Proof verified successfully with Developer Portal',
              );
            } else {
              setStatusMessage(
                `Proof verification failed: ${JSON.stringify(verifyResponse)}`,
              );
            }
          }}
          onError={(errorCode) => {
            setStatusMessage(`Verification failed: ${errorCode}`);
          }}
          environment={environment}
        />
      )}

      <VerifyOnchainProof />
    </div>
  );
};
