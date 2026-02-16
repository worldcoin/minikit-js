import Safe, { hashSafeMessage } from '@safe-global/protocol-kit';
import {
  MiniKit,
  MiniKitSignMessageOptions,
  ResponseEvent,
  SignMessageErrorCodes,
} from '@worldcoin/minikit-js';
import { useState } from 'react';
import { verifyMessage } from 'viem';
import * as yup from 'yup';

const signMessageSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().oneOf(['success']),
  signature: yup.string().required(),
  address: yup.string().required(),
});

const signMessageErrorPayloadSchema = yup.object({
  error_code: yup
    .string<SignMessageErrorCodes>()
    .oneOf(Object.values(SignMessageErrorCodes))
    .required(),
  status: yup.string<'error'>().equals(['error']).required(),
  version: yup.number().required(),
});

export const SignMessage = () => {
  const [signMessageAppPayload, setSignMessageAppPayload] = useState<
    string | undefined
  >();

  const [
    signMessagePayloadValidationMessage,
    setSignMessagePayloadValidationMessage,
  ] = useState<string | null>();

  const [
    signMessagePayloadVerificationMessage,
    setSignMessagePayloadVerificationMessage,
  ] = useState<string | null>();

  const [sentSignMessagePayload, setSentSignMessagePayload] = useState<Record<
    string,
    any
  > | null>(null);
  const [messageToSign, setMessageToSign] = useState('hello world');

  const onSignMessage = async (message: string) => {
    const signMessagePayload: MiniKitSignMessageOptions = {
      message,
    };

    setMessageToSign(message);
    setSentSignMessagePayload({
      signMessagePayload,
    });
    const payload = await MiniKit.signMessage(signMessagePayload);
    if (payload.executedWith === 'minikit') {
      const response = payload.data;
      const messageHash = hashSafeMessage(messageToSign);
      setSignMessageAppPayload(JSON.stringify(response, null, 2));

      const isValid = await (
        await Safe.init({
          provider: 'https://worldchain-mainnet.g.alchemy.com/public',
          safeAddress: response.address,
        })
      ).isValidSignature(messageHash, response.signature);

      setSignMessagePayloadVerificationMessage(
        isValid ? 'Signature is valid' : 'Signature is invalid',
      );
    } else if (payload.executedWith === 'wagmi') {
      const response = payload.data;

      setSignMessageAppPayload(JSON.stringify(response, null, 2));
      // Verify EOA signed message

      const isValid = await verifyMessage({
        address: response.address as `0x${string}`,
        message: messageToSign,
        signature: response.signature as `0x${string}`,
      });

      setSignMessagePayloadVerificationMessage(
        isValid ? 'Signature is valid' : 'Signature is invalid',
      );
    } else {
      // Fallback
      setSignMessageAppPayload(JSON.stringify(payload, null, 2));
      setSignMessagePayloadVerificationMessage('Signature is invalid');
    }
  };

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Sign Message</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(sentSignMessagePayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid gap-y-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => onSignMessage('hello world')}
          >
            Sign Message
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              await onSignMessage('world-chat-authentication:test');
            }}
          >
            Fail Message
          </button>
        </div>
      </div>

      <hr />

      <div className="w-full grid gap-y-2">
        <p>Message from &quot;{ResponseEvent.MiniAppSignMessage}&quot; </p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {signMessageAppPayload ?? JSON.stringify(null)}
          </pre>
        </div>

        <div className="grid gap-y-2">
          <p>Response Validation:</p>
          <p className="bg-gray-300 p-2">
            {signMessagePayloadValidationMessage ?? 'No validation'}
          </p>
        </div>
        <div>
          <p>Check does signature verify:</p>
          <p className="bg-gray-300 p-2">
            {signMessagePayloadVerificationMessage ?? 'No verification'}
          </p>
        </div>
      </div>
    </div>
  );
};
