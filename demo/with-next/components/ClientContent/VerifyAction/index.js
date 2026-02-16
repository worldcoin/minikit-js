'use client';
import { IDKit, IDKitRequestWidget, orbLegacy } from '@worldcoin/idkit';
import { clsx } from 'clsx';
import { useCallback, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { verifyProof } from './verify-cloud-proof';
import { VerifyOnchainProof } from './verify-onchain';
export const VerifyAction = () => {
  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  const [verifyResult, setVerifyResult] = useState();
  const [sentVerifyPayload, setSentVerifyPayload] = useState(null);
  const [devPortalVerifyResponse, setDevPortalVerifyResponse] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [lastUsedAppId, setLastUsedAppId] = useState(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [rpContext, setRpContext] = useState(null);
  const verifyAction = useCallback(async (params) => {
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
      const rpContext = {
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
      setVerifyResult(completion);
      setStatusMessage('Verification complete');
      // Verify with dev portal
      const responses = completion.success
        ? completion.result?.responses
        : undefined;
      if (responses && responses.length > 0) {
        const firstResponse = responses[0];
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
    } catch (err) {
      setStatusMessage(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, []);
  const onProdVerifyClick = useCallback(() => {
    verifyAction({
      app_id: process.env.NEXT_PUBLIC_PROD_VERIFY_APP_ID,
      action: process.env.NEXT_PUBLIC_PROD_VERIFY_ACTION,
      signal: 'test',
    });
  }, [verifyAction]);
  const onStagingVerifyClick = useCallback(() => {
    verifyAction({
      app_id: process.env.NEXT_PUBLIC_STAGING_VERIFY_APP_ID,
      action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION,
      signal: 'test',
    });
  }, [verifyAction]);
  const onStagingIDKitVerifyClick = useCallback(async () => {
    setVerifyResult(undefined);
    setStatusMessage(null);
    setDevPortalVerifyResponse(null);
    const res = await fetch('/api/rp-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      setStatusMessage(`RP signature request failed: ${text}`);
      return;
    }
    const rpSig = await res.json();
    const rpContext = {
      rp_id: rpSig.rp_id,
      nonce: rpSig.nonce,
      created_at: rpSig.created_at,
      expires_at: rpSig.expires_at,
      signature: rpSig.sig,
    };
    setRpContext(rpContext);
    setWidgetOpen(true);
  }, []);
  return _jsxs('div', {
    className: 'grid gap-y-4',
    children: [
      _jsx('h2', {
        className: 'font-bold text-2xl',
        children: 'Verify (IDKit)',
      }),
      rpContext &&
        _jsx(IDKitRequestWidget, {
          open: widgetOpen,
          onOpenChange: setWidgetOpen,
          app_id: process.env.NEXT_PUBLIC_STAGING_VERIFY_APP_ID,
          action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION,
          rp_context: rpContext,
          allow_legacy_proofs: true,
          preset: orbLegacy({ signal: 'demo-signal' }),
          onSuccess: (result) => {
            setVerifyResult({ executedWith: 'idkit', data: result });
          },
          onError: (errorCode) => {
            setVerifyResult({ error: `Verification failed: ${errorCode}` });
          },
        }),
      _jsxs('p', {
        className: 'border p-1 border-gray-400',
        children: [
          _jsx('span', { className: 'font-bold block', children: 'App ID:' }),
          _jsx('span', {
            className: 'text-[12px] break-all',
            children: lastUsedAppId ?? '',
          }),
        ],
      }),
      _jsxs('div', {
        className: 'grid gap-y-12',
        children: [
          _jsxs('div', {
            className: 'grid gap-y-2',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('p', { children: 'Sent payload:' }),
                  _jsx('div', {
                    className: 'bg-gray-300 min-h-[100px] p-2',
                    children: _jsx('pre', {
                      className: 'break-all whitespace-break-spaces',
                      children: JSON.stringify(sentVerifyPayload, null, 2),
                    }),
                  }),
                ],
              }),
              _jsx('div', {
                className: 'grid gap-y-2',
                children: _jsx('div', {
                  className: 'grid grid-cols-2 gap-x-2',
                  children: _jsx('button', {
                    className: clsx(
                      'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                      isProduction ? 'hidden' : '',
                    ),
                    onClick: onStagingIDKitVerifyClick,
                    children: 'Send IDKit Staging Verify',
                  }),
                }),
              }),
              _jsxs('div', {
                className: 'grid gap-y-2',
                children: [
                  _jsx('div', {
                    className: 'grid grid-cols-2 gap-x-2',
                    children: _jsx('button', {
                      className: clsx(
                        'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                        isProduction ? 'hidden' : '',
                      ),
                      onClick: onStagingVerifyClick,
                      children: 'Send staging verify (Orb)',
                    }),
                  }),
                  _jsx('div', {
                    className: 'grid grid-cols-2 gap-x-2',
                    children: _jsx('button', {
                      className: clsx(
                        'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                        isProduction ? '' : 'hidden',
                      ),
                      onClick: onProdVerifyClick,
                      children: 'Send production verify (Orb)',
                    }),
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'w-full grid gap-y-2',
            children: [
              _jsx('p', { children: 'IDKit Verify Result' }),
              _jsx('div', {
                className: 'bg-gray-300 min-h-[100px] p-2',
                children: _jsx('pre', {
                  className: 'break-all whitespace-break-spaces',
                  children:
                    JSON.stringify(verifyResult, null, 2) ??
                    JSON.stringify(null),
                }),
              }),
              _jsxs('div', {
                className: 'grid gap-y-2',
                children: [
                  _jsx('p', { children: 'Status:' }),
                  _jsx('p', {
                    className: 'bg-gray-300 p-2',
                    children: statusMessage ?? 'No verification yet',
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'grid gap-y-2',
                children: [
                  _jsx('p', {
                    children: '`DEV_PORTAL/api/v2/verify` Response:',
                  }),
                  _jsx('pre', {
                    className:
                      'break-all whitespace-break-spaces bg-gray-300 p-2',
                    children:
                      JSON.stringify(devPortalVerifyResponse, null, 2) ??
                      'No validation',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsx(VerifyOnchainProof, {}),
    ],
  });
};
