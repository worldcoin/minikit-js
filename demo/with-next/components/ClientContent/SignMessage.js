import Safe, { hashSafeMessage } from '@safe-global/protocol-kit';
import {
  MiniKit,
  ResponseEvent,
  SignMessageErrorCodes,
} from '@worldcoin/minikit-js';
import { useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';
const signMessageSuccessPayloadSchema = yup.object({
  status: yup.string().oneOf(['success']),
  signature: yup.string().required(),
  address: yup.string().required(),
});
const signMessageErrorPayloadSchema = yup.object({
  error_code: yup
    .string()
    .oneOf(Object.values(SignMessageErrorCodes))
    .required(),
  status: yup.string().equals(['error']).required(),
  version: yup.number().required(),
});
export const SignMessage = () => {
  const [signMessageAppPayload, setSignMessageAppPayload] = useState();
  const [
    signMessagePayloadValidationMessage,
    setSignMessagePayloadValidationMessage,
  ] = useState();
  const [
    signMessagePayloadVerificationMessage,
    setSignMessagePayloadVerificationMessage,
  ] = useState();
  const [sentSignMessagePayload, setSentSignMessagePayload] = useState(null);
  const [tempInstallFix, setTempInstallFix] = useState(0);
  const [messageToSign, setMessageToSign] = useState('hello world');
  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    MiniKit.subscribe(ResponseEvent.MiniAppSignMessage, async (payload) => {
      console.log('MiniAppSignMessage, SUBSCRIBE PAYLOAD', payload);
      setSignMessageAppPayload(JSON.stringify(payload, null, 2));
      if (payload.status === 'error') {
        const errorMessage = await validateSchema(
          signMessageErrorPayloadSchema,
          payload,
        );
        if (!errorMessage) {
          setSignMessagePayloadValidationMessage('Payload is valid');
        } else {
          setSignMessagePayloadValidationMessage(errorMessage);
        }
      } else {
        const errorMessage = await validateSchema(
          signMessageSuccessPayloadSchema,
          payload,
        );
        // This checks if the response format is correct
        if (!errorMessage) {
          setSignMessagePayloadValidationMessage('Payload is valid');
        } else {
          setSignMessagePayloadValidationMessage(errorMessage);
        }
        const messageHash = hashSafeMessage(messageToSign);
        const isValid = await (
          await Safe.init({
            provider: 'https://worldchain-mainnet.g.alchemy.com/public',
            safeAddress: payload.address,
          })
        ).isValidSignature(messageHash, payload.signature);
        // Checks functionally if the signature is correct
        if (isValid) {
          setSignMessagePayloadVerificationMessage('Signature is valid');
        } else {
          setSignMessagePayloadVerificationMessage('Signature is invalid');
        }
      }
    });
    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSignMessage);
    };
  }, [messageToSign, tempInstallFix]);
  const onSignMessage = async (message) => {
    const signMessagePayload = {
      message,
    };
    setMessageToSign(message);
    const payload = MiniKit.signMessage(signMessagePayload);
    setSentSignMessagePayload({
      payload,
    });
    setTempInstallFix((prev) => prev + 1);
  };
  return _jsxs('div', {
    children: [
      _jsxs('div', {
        className: 'grid gap-y-2',
        children: [
          _jsx('h2', {
            className: 'text-2xl font-bold',
            children: 'Sign Message',
          }),
          _jsx('div', {
            children: _jsx('div', {
              className: 'bg-gray-300 min-h-[100px] p-2',
              children: _jsx('pre', {
                className: 'break-all whitespace-break-spaces',
                children: JSON.stringify(sentSignMessagePayload, null, 2),
              }),
            }),
          }),
          _jsxs('div', {
            className: 'grid gap-y-2',
            children: [
              _jsx('button', {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: () => onSignMessage('hello world'),
                children: 'Sign Message',
              }),
              _jsx('button', {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: async () => {
                  await onSignMessage('world-chat-authentication:test');
                },
                children: 'Fail Message',
              }),
            ],
          }),
        ],
      }),
      _jsx('hr', {}),
      _jsxs('div', {
        className: 'w-full grid gap-y-2',
        children: [
          _jsxs('p', {
            children: [
              'Message from "',
              ResponseEvent.MiniAppSignMessage,
              '" ',
            ],
          }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: signMessageAppPayload ?? JSON.stringify(null),
            }),
          }),
          _jsxs('div', {
            className: 'grid gap-y-2',
            children: [
              _jsx('p', { children: 'Response Validation:' }),
              _jsx('p', {
                className: 'bg-gray-300 p-2',
                children:
                  signMessagePayloadValidationMessage ?? 'No validation',
              }),
            ],
          }),
          _jsxs('div', {
            children: [
              _jsx('p', { children: 'Check does signature verify:' }),
              _jsx('p', {
                className: 'bg-gray-300 p-2',
                children:
                  signMessagePayloadVerificationMessage ?? 'No verification',
              }),
            ],
          }),
        ],
      }),
    ],
  });
};
