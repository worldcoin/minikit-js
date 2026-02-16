import {
  MiniKit,
  ResponseEvent,
  SendHapticFeedbackErrorCodes,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';
const sendHapticFeedbackSuccessPayloadSchema = yup.object({
  status: yup.string().oneOf(['success']),
});
const sendHapticFeedbackErrorPayloadSchema = yup.object({
  error_code: yup
    .string()
    .oneOf(Object.values(SendHapticFeedbackErrorCodes))
    .required(),
  status: yup.string().equals(['error']).required(),
  version: yup.number().required(),
});
const allPossibleHaptics = [
  { hapticsType: 'impact', style: 'heavy' },
  { hapticsType: 'impact', style: 'light' },
  { hapticsType: 'impact', style: 'medium' },
  { hapticsType: 'notification', style: 'error' },
  { hapticsType: 'notification', style: 'success' },
  { hapticsType: 'notification', style: 'warning' },
  { hapticsType: 'selection-changed' },
];
export const SendHapticFeedback = () => {
  const [sentHapticFeedbackPayload, setSentHapticFeedbackPayload] =
    useState(null);
  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    MiniKit.subscribe(
      ResponseEvent.MiniAppSendHapticFeedback,
      async (payload) => {
        console.log('MiniAppSendHapticFeedback, SUBSCRIBE PAYLOAD', payload);
        if (payload.status === 'error') {
          const validationErrorMessage = await validateSchema(
            sendHapticFeedbackErrorPayloadSchema,
            payload,
          );
          if (!validationErrorMessage) {
            console.log('Payload is valid');
          } else {
            console.error(validationErrorMessage);
          }
        } else {
          const validationErrorMessage = await validateSchema(
            sendHapticFeedbackSuccessPayloadSchema,
            payload,
          );
          // This checks if the response format is correct
          if (!validationErrorMessage) {
            console.log('Payload is valid');
          } else {
            console.error(validationErrorMessage);
          }
        }
      },
    );
    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSignTypedData);
    };
  }, []);
  const onSendHapticFeedback = useCallback(async (input) => {
    const payload = MiniKit.sendHapticFeedback(input);
    setSentHapticFeedbackPayload({
      payload,
    });
  }, []);
  return _jsx('div', {
    children: _jsxs('div', {
      className: 'grid gap-y-2',
      children: [
        _jsx('h2', {
          className: 'text-2xl font-bold',
          children: 'Send Haptics',
        }),
        _jsx('div', {
          children: _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className:
                'break-all whitespace-break-spaces max-h-[250px] overflow-y-scroll ',
              children: JSON.stringify(sentHapticFeedbackPayload, null, 2),
            }),
          }),
        }),
        _jsx('div', {
          className: 'grid grid-cols-2 gap-2',
          children: allPossibleHaptics.map((haptic, i) =>
            _jsx(
              'button',
              {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: () => onSendHapticFeedback(haptic),
                children: `Send ${haptic.hapticsType}-${haptic?.style}`,
              },
              i,
            ),
          ),
        }),
      ],
    }),
  });
};
