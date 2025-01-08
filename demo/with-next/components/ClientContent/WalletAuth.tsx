import {
  MiniKit,
  ResponseEvent,
  WalletAuthErrorCodes,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const walletAuthSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().oneOf(['success']),
  message: yup.string().required(),
  signature: yup.string().required(),
  address: yup.string().required(),
});

const walletAuthErrorPayloadSchema = yup.object({
  error_code: yup
    .string<WalletAuthErrorCodes>()
    .oneOf(Object.values(WalletAuthErrorCodes))
    .required(),
  status: yup.string<'error'>().equals(['error']).required(),
});

export const WalletAuth = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [receivedWalletAuthPayload, setReceivedWalletAuthPayload] =
    useState<Record<string, any> | null>(null);

  const [
    walletAuthPayloadValidationMessage,
    setWalletAuthPayloadValidationMessage,
  ] = useState<string | null>();

  const [walletAuthVerificationMessage, setWalletAuthVerificationMessage] =
    useState<string | null>();

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    MiniKit.subscribe(ResponseEvent.MiniAppWalletAuth, async (payload) => {
      console.log('MiniAppWalletAuth, SUBSCRIBE PAYLOAD', payload);
      if (payload.status === 'error') {
        const errorMessage = await validateSchema(
          walletAuthErrorPayloadSchema,
          payload,
        );

        if (!errorMessage) {
          setWalletAuthPayloadValidationMessage('Payload is valid');
        } else {
          setWalletAuthPayloadValidationMessage(errorMessage);
        }
      } else {
        const errorMessage = await validateSchema(
          walletAuthSuccessPayloadSchema,
          payload,
        );

        if (!errorMessage) {
          setWalletAuthPayloadValidationMessage('Payload is valid');
        } else {
          setWalletAuthPayloadValidationMessage(errorMessage);
        }

        // Call the API to verify the message
        const response = await fetch('/api/verify-siwe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            siweResponsePayload: payload,
            nonce,
          }),
        });

        const responseJson = await response.json();

        setWalletAuthVerificationMessage(
          responseJson.isValid
            ? 'Valid! Successfully Signed In'
            : `Failed: ${responseJson.message}`,
        );
      }

      setReceivedWalletAuthPayload(payload);
      console.log('From object', MiniKit?.walletAddress);
      //@ts-ignore
      console.log('From static', window.MiniKit?.walletAddress);
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppWalletAuth);
    };
  }, [nonce]);

  const onGenerateMessageClick = useCallback(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    const nonce = window.crypto.randomUUID();
    setNonce(nonce);
    const generateMessageResult = MiniKit.commands.walletAuth({
      nonce: nonce,
      requestId: '0',
      expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      statement:
        'This is my statement and here is a link https://worldcoin.com/apps',
    });

    if (!generateMessageResult) {
      return setGenerationError('Failed to generate message');
    }

    return setMessage(generateMessageResult.siweMessage);
  }, []);

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Wallet Auth</h2>

      <div className="grid gap-y-1">
        <p>Raw string:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-pre-line">
            {(message ? JSON.stringify(message) : generationError) ??
              JSON.stringify(null)}
          </pre>
        </div>
      </div>

      <div className="grid gap-y-1">
        <p>Beautified string:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {message ?? generationError ?? JSON.stringify(null)}
          </pre>
        </div>
      </div>

      <button
        className="bg-black text-white rounded-lg p-4 w-full"
        onClick={onGenerateMessageClick}
      >
        Generate message
      </button>

      <div className="grid gap-y-1">
        <p>Received from &quot;{ResponseEvent.MiniAppWalletAuth}&quot;: </p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(receivedWalletAuthPayload, null, 2)}
          </pre>
        </div>

        <div className="grid gap-y-1">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {walletAuthPayloadValidationMessage ?? 'No validation'}
          </p>
        </div>

        <div className="grid gap-y-1">
          <p>Verification:</p>
          <p className="bg-gray-300 p-2">
            {walletAuthVerificationMessage ?? 'No verification yet'}
          </p>
        </div>
      </div>
    </div>
  );
};
