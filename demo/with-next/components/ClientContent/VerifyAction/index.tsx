'use client';
import {
  IDKit,
  IDKitRequestWidget,
  orbLegacy,
  type IDKitResult,
  type RpContext,
} from '@worldcoin/idkit';
import { useMiniKit } from '@worldcoin/minikit-js/provider';
import { useCallback, useState } from 'react';
import { verifyProof } from './verify-cloud-proof';
import { VerifyOnchainProof } from './verify-onchain';

type VerifyTarget = {
  appId: `app_${string}`;
  action: string;
  environment: 'staging' | 'production';
};

export const VerifyAction = () => {
  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';

  const [verifyResult, setVerifyResult] = useState<
    Record<string, any> | undefined
  >();
  const [sentVerifyPayload, setSentVerifyPayload] = useState<Record<
    string,
    any
  > | null>(null);
  const [devPortalVerifyResponse, setDevPortalVerifyResponse] = useState<Record<
    string,
    any
  > | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastUsedAppId, setLastUsedAppId] = useState<`app_${string}` | null>(
    null,
  );
  const { isInstalled } = useMiniKit();
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetTarget, setWidgetTarget] = useState<VerifyTarget | null>(null);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);

  const target: VerifyTarget = {
    appId: (isProduction
      ? process.env.NEXT_PUBLIC_PROD_VERIFY_APP_ID
      : process.env.NEXT_PUBLIC_STAGING_VERIFY_APP_ID) as `app_${string}`,
    action: (isProduction
      ? process.env.NEXT_PUBLIC_PROD_VERIFY_ACTION
      : process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION) as string,
    environment: isProduction ? 'production' : 'staging',
  };
  const verifyIDKitProof = useCallback(
    async (
      result: IDKitResult,
      app_id: `app_${string}`,
      fallbackAction: string,
    ) => {
      if (!result) {
        setStatusMessage('No verification result to verify');
        return;
      }

      if ('session_id' in result) {
        setStatusMessage('Session proof verification is not supported here');
        return;
      }

      const verifyResponse = await verifyProof({
        app_id,
        action: result.action ?? fallbackAction,
        action_description: result.action_description,
        nonce: result.nonce,
        protocol_version: result.protocol_version,
        responses: result.responses as any,
        environment: result.environment,
      });
      setDevPortalVerifyResponse(verifyResponse);

      if (verifyResponse) {
        if (verifyResponse.success) {
          setStatusMessage('Proof verified successfully with Developer Portal');
        } else {
          setStatusMessage(
            `Proof verification failed with Developer Portal: ${verifyResponse}`,
          );
        }
      }
    },
    [],
  );

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
          setStatusMessage(`RP signature requests failed: ${text}`);
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
        const request = await IDKit.request(config).preset(
          orbLegacy({ signal: signal ?? '' }),
        );

        setStatusMessage('Waiting for verification...');
        const completion = await request.pollUntilCompletion();
        setVerifyResult(completion as unknown as Record<string, any>);
        setStatusMessage('Verification complete');

        // Verify with dev portal
        if (completion.success && completion.result) {
          await verifyIDKitProof(
            completion.result as IDKitResult,
            app_id,
            action,
          );
        }
      } catch (err: unknown) {
        setStatusMessage(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [verifyIDKitProof],
  );

  const openWidgetFlow = useCallback(async (verifyTarget: VerifyTarget) => {
    const { appId, action } = verifyTarget;

    setLastUsedAppId(appId);
    setVerifyResult(undefined);
    setStatusMessage(null);
    setDevPortalVerifyResponse(null);

    const res = await fetch('/api/rp-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
      }),
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
    setSentVerifyPayload({
      app_id: appId,
      action,
      rp_context: rpContext,
      allow_legacy_proofs: true,
    });
    setWidgetTarget(verifyTarget);
    setRpContext(rpContext);
    setStatusMessage('Opening IDKit widget...');
    setWidgetOpen(true);
  }, []);

  const onVerifyClick = useCallback(async () => {
    if (isInstalled) {
      setStatusMessage('Detected World App. Using native IDKit flow.');
      verifyAction({
        app_id: target.appId,
        action: target.action,
        signal: 'test',
      });
      return;
    }

    setStatusMessage('Detected browser. Using IDKit widget flow.');
    await openWidgetFlow(target);
  }, [openWidgetFlow, target, verifyAction]);

  return (
    <div className="grid gap-y-4">
      <h2 className="font-bold text-2xl">Verify (IDKit)</h2>
      {rpContext && widgetTarget && (
        <IDKitRequestWidget
          open={widgetOpen}
          environment={widgetTarget.environment}
          onOpenChange={setWidgetOpen}
          app_id={widgetTarget.appId}
          action={widgetTarget.action}
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy({ signal: 'demo-signal' })}
          onSuccess={(result: IDKitResult) => {
            setVerifyResult({ executedWith: 'minikit', data: result });
            verifyIDKitProof(result, widgetTarget.appId, widgetTarget.action);
          }}
          onError={(errorCode) => {
            console.log('Verification error:', errorCode);
            setVerifyResult({ error: `Verification failed: ${errorCode}` });
          }}
        />
      )}
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
                className="bg-black text-white rounded-lg p-4 w-full disabled:opacity-20"
                onClick={onVerifyClick}
              >
                {isProduction
                  ? 'Send production verify'
                  : 'Send staging verify'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-full grid gap-y-2">
          <p>IDKit Verify Result</p>

          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(verifyResult, null, 2) ?? JSON.stringify(null)}
            </pre>
          </div>

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
      <VerifyOnchainProof />
    </div>
  );
};
