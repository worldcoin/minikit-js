import {
  ISuccessResult,
  MiniKit,
  ResponseEvent,
  VerificationErrorCodes,
  VerificationLevel,
  VerifyCommandInput,
} from '@worldcoin/minikit-js';
import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from '../helpers/validate-schema';
import { verifyProof } from './verify-cloud-proof';
import { VerifyOnchainProof } from './verify-onchain';

const verifyActionSuccessPayloadSchema = yup.object({
  status: yup
    .string<'success' | 'error'>()
    .oneOf(['success', 'error'])
    .required(),
  proof: yup.string().required(),
  merkle_root: yup.string().required(),
  nullifier_hash: yup.string().required(),
  verification_level: yup
    .string<VerificationLevel>()
    .oneOf(Object.values(VerificationLevel))
    .required(),
});

const verifyActionErrorPayloadSchema = yup.object({
  status: yup.string().equals(['error']).required(),
  error_code: yup
    .string<VerificationErrorCodes>()
    .oneOf(Object.values(VerificationErrorCodes))
    .required(),
});

export const VerifyAction = () => {
  const [
    verifyActionAppPayloadValidationMessage,
    setVerifyActionAppPayloadValidationMessage,
  ] = useState<string | null>(null);
  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  const [verifyActionAppPayload, setVerifyActionAppPayload] = useState<
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

  const [lastUsedAppId, setLastUsedAppId] = useState<`app_${string}` | null>(
    null,
  );

  const [lastUsedAction, setLastUsedAction] = useState<string | null>(null);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, async (payload) => {
      console.log('MiniAppVerifyAction, SUBSCRIBE PAYLOAD', payload);

      if (payload.status === 'error') {
        const errorMessage = await validateSchema(
          verifyActionErrorPayloadSchema,
          payload,
        );
        if (errorMessage) {
          return setVerifyActionAppPayloadValidationMessage(errorMessage);
        }
        setVerifyActionAppPayloadValidationMessage(`Payload is valid!`);

        setVerifyActionAppPayload(payload);
      }

      const errorMessage = await validateSchema(
        verifyActionSuccessPayloadSchema,
        payload,
      );

      if (errorMessage) {
        return setVerifyActionAppPayloadValidationMessage(errorMessage);
      }

      setVerifyActionAppPayloadValidationMessage('Payload is valid');
      setVerifyActionAppPayload(payload);

      if (!lastUsedAppId || !lastUsedAction) {
        return console.log('lastUsedAppId or lastUsedAction is not set');
      }

      const verifyResponse = await verifyProof({
        payload: payload as ISuccessResult,
        app_id: lastUsedAppId,
        action: lastUsedAction,
        signal: 'test',
      });

      setDevPortalVerifyResponse(verifyResponse);
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction);
    };
  }, [lastUsedAction, lastUsedAppId]);

  const verifyAction = useCallback(
    (params: {
      app_id: `app_${string}`;
      action: string;
      verification_level?: VerificationLevel;
      signal?: string;
    }) => {
      setLastUsedAppId(params.app_id);
      setLastUsedAction(params.action);

      // Anchor Reset Fields
      setSentVerifyPayload(null);
      setVerifyActionAppPayload(undefined);
      setVerifyActionAppPayloadValidationMessage(null);
      setDevPortalVerifyResponse(null);

      const verifyPayload: VerifyCommandInput = {
        action: params.action,
        verification_level: params.verification_level,
        signal: params.signal,
      };

      const payload = MiniKit.commands.verify(verifyPayload);
      setSentVerifyPayload(payload);
    },
    [],
  );

  const onProdVerifyClick = useCallback(
    (verification_level: VerificationLevel) => {
      verifyAction({
        app_id: process.env.NEXT_PUBLIC_PROD_VERIFY_APP_ID as `app_${string}`,
        action: process.env.NEXT_PUBLIC_PROD_VERIFY_ACTION as string,
        verification_level,
        signal: 'test',
      });
    },
    [verifyAction],
  );

  const onStagingVerifyClick = useCallback(
    (verification_level: VerificationLevel) => {
      verifyAction({
        app_id: process.env
          .NEXT_PUBLIC_STAGING_VERIFY_APP_ID as `app_${string}`,
        action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION as string,
        verification_level,
        signal: 'test',
      });
    },
    [verifyAction],
  );

  return (
    <div className="grid gap-y-4">
      <h2 className="font-bold text-2xl">Verify</h2>

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
                onClick={() => onStagingVerifyClick(VerificationLevel.Device)}
              >
                Send staging app verify (Device)
              </button>
              <button
                className={clsx(
                  'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                  isProduction ? 'hidden' : '',
                )}
                onClick={() => onStagingVerifyClick(VerificationLevel.Document)}
              >
                Send staging app verify (Document)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-2">
              <button
                className={clsx(
                  'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                  isProduction ? 'hidden' : '',
                )}
                onClick={() =>
                  onStagingVerifyClick(VerificationLevel.SecureDocument)
                }
              >
                Send staging app verify (SecureDocument)
              </button>
              <button
                className={clsx(
                  'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                  isProduction ? 'hidden' : '',
                )}
                onClick={() => onStagingVerifyClick(VerificationLevel.Orb)}
              >
                Send staging app verify (Orb)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-2">
              <button
                className={clsx(
                  'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                  isProduction ? '' : 'hidden',
                )}
                onClick={() => onProdVerifyClick(VerificationLevel.Device)}
              >
                Send production app verify (Device)
              </button>
              <button
                className={clsx(
                  'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                  isProduction ? '' : 'hidden',
                )}
                onClick={() => onProdVerifyClick(VerificationLevel.Document)}
              >
                Send production app verify (Document)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-x-2">
              <button
                className={clsx(
                  'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                  isProduction ? '' : 'hidden',
                )}
                onClick={() =>
                  onProdVerifyClick(VerificationLevel.SecureDocument)
                }
              >
                Send production app verify (SecureDocument)
              </button>
              <button
                className={clsx(
                  'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
                  isProduction ? '' : 'hidden',
                )}
                onClick={() => onProdVerifyClick(VerificationLevel.Orb)}
              >
                Send production app verify (Orb)
              </button>
            </div>
          </div>
        </div>

        <div className="w-full grid gap-y-2">
          <p>Message from &quot;{ResponseEvent.MiniAppVerifyAction}&quot; </p>

          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(verifyActionAppPayload, null, 2) ??
                JSON.stringify(null)}
            </pre>
          </div>

          <div className="grid gap-y-2">
            <p>Validation message:</p>
            <p className="bg-gray-300 p-2">
              {verifyActionAppPayloadValidationMessage ?? 'No validation'}
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
