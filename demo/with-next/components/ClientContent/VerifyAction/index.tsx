'use client';
import {
  CredentialRequest,
  IDKitRequestWidget,
  type CredentialType,
  type IDKitResult,
  type RpContext,
} from '@worldcoin/idkit';
import { useMemo, useState } from 'react';
import { verifyProof } from './verify-cloud-proof';
import { VerifyOnchainProof } from './verify-onchain';

type IDKitEnvironment = 'production' | 'staging' | 'sandbox';

export const VerifyAction = () => {
  const [environment, setEnvironment] = useState<IDKitEnvironment>(
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
      ? 'production'
      : 'staging',
  );
  const [credential, setCredential] =
    useState<CredentialType>('proof_of_human');
  const [requireUserPresence, setRequireUserPresence] = useState(false);

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
  const [widgetAction, setWidgetAction] = useState<string | null>(null);

  const isProduction = environment === 'production';
  const appId = (
    isProduction
      ? process.env.NEXT_PUBLIC_PROD_VERIFY_APP_ID
      : process.env.NEXT_PUBLIC_STAGING_VERIFY_APP_ID
  ) as `app_${string}`;
  const action = (
    isProduction
      ? process.env.NEXT_PUBLIC_PROD_VERIFY_ACTION
      : process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION
  ) as string;

  const constraints = useMemo(
    () => CredentialRequest(credential, { signal: widgetSignal }),
    [credential, widgetSignal],
  );

  const startVerify = async () => {
    setSentVerifyPayload(null);
    setStatusMessage(null);
    setDevPortalVerifyResponse(null);

    try {
      if (!appId || !action) {
        setStatusMessage(
          `Missing ${isProduction ? 'production' : 'staging'} app ID or action configuration`,
        );
        return;
      }

      // v4 nullifiers are one-time use for each RP and action. This is a
      // repeatable demo test, so each attempt intentionally gets its own
      // action instead of weakening a real one-per-action flow.
      const requestAction = `${action}-test-${crypto.randomUUID()}`;

      const res = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: requestAction }),
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
      const signal = `test-${Date.now()}`;

      setSentVerifyPayload({
        app_id: appId,
        action: requestAction,
        rp_context: rpCtx,
        allow_legacy_proofs: false,
        require_user_presence: requireUserPresence,
        environment,
        constraints: CredentialRequest(credential, { signal }),
      });
      setWidgetSignal(signal);
      setWidgetAction(requestAction);
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
          <div className="grid gap-y-2 border border-gray-400 p-3">
            <p className="font-bold">IDKit v4 test options</p>
            <label className="grid gap-y-1 text-sm">
              Environment
              <select
                className="border border-gray-400 rounded p-2"
                value={environment}
                disabled={widgetOpen}
                onChange={(event) =>
                  setEnvironment(event.target.value as IDKitEnvironment)
                }
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="sandbox">Sandbox</option>
              </select>
            </label>
            <label className="grid gap-y-1 text-sm">
              Credential
              <select
                className="border border-gray-400 rounded p-2"
                value={credential}
                disabled={widgetOpen}
                onChange={(event) =>
                  setCredential(event.target.value as CredentialType)
                }
              >
                <option value="proof_of_human">Proof of Human</option>
                <option value="selfie">Selfie</option>
                <option value="passport">Passport</option>
                <option value="mnc">Mobile Network Credential</option>
              </select>
            </label>
            <label className="flex items-center gap-x-2 text-sm">
              <input
                type="checkbox"
                checked={requireUserPresence}
                disabled={widgetOpen}
                onChange={(event) =>
                  setRequireUserPresence(event.target.checked)
                }
              />
              Require user presence
            </label>
            {environment === 'sandbox' && (
              <p className="text-sm text-gray-600">
                Sandbox uses the staging app ID and action configuration.
              </p>
            )}
          </div>
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
                disabled={widgetOpen}
              >
                Send {environment} verify
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

      {rpContext && widgetAction && (
        <IDKitRequestWidget
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          app_id={appId}
          action={widgetAction}
          rp_context={rpContext}
          allow_legacy_proofs={false}
          require_user_presence={requireUserPresence}
          constraints={constraints}
          onSuccess={() => {
            setStatusMessage('Verification complete');
          }}
          handleVerify={async (result: IDKitResult) => {
            const verifyResponse = await verifyProof(
              result,
              rpContext.rp_id,
              environment,
            );
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
