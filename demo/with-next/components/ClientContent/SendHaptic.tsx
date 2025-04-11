import {
  MiniAppSendHapticFeedbackPayload,
  MiniKit,
  ResponseEvent,
  SendHapticFeedbackErrorCodes,
  SendHapticFeedbackInput,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const sendHapticFeedbackSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().oneOf(['success']),
});

const sendHapticFeedbackErrorPayloadSchema = yup.object({
  error_code: yup
    .string<SendHapticFeedbackErrorCodes>()
    .oneOf(Object.values(SendHapticFeedbackErrorCodes))
    .required(),
  status: yup.string<'error'>().equals(['error']).required(),
  version: yup.number().required(),
});

const allPossibleHaptics: SendHapticFeedbackInput[] = [
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
    useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppSendHapticFeedback,
      async (payload: MiniAppSendHapticFeedbackPayload) => {
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

  const onSendHapticFeedback = useCallback(
    async (input: SendHapticFeedbackInput) => {
      const payload = MiniKit.commands.sendHapticFeedback(input);

      setSentHapticFeedbackPayload({
        payload,
      });
    },
    [],
  );

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Send Haptics</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces max-h-[250px] overflow-y-scroll ">
              {JSON.stringify(sentHapticFeedbackPayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {allPossibleHaptics.map((haptic, i) => (
            <button
              key={i}
              className="bg-black text-white rounded-lg p-4 w-full"
              onClick={() => onSendHapticFeedback(haptic)}
            >
              {`Send ${haptic.hapticsType}-${haptic?.style}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
