import {
  ChatPayload,
  ChatErrorCodes,
  MiniAppChatPayload,
  MiniKit,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const chatSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().oneOf(['success']),
  count: yup.number().required(),
  timestamp: yup.string().required(),
  version: yup.number().required(),
});

const chatErrorPayloadSchema = yup.object({
  error_code: yup
    .string<ChatErrorCodes>()
    .oneOf(Object.values(ChatErrorCodes))
    .required(),
  status: yup.string<'error'>().equals(['error']).required(),
  version: yup.number().required(),
});

export const Chat = () => {
  const [sentChatPayload, setSentChatPayload] =
    useState<Record<string, any> | null>(null);
  const [toAddress, setToAddress] = useState<string>('');
  const [message, setMessage] = useState<string>('Hello from MiniKit!');

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppChat,
      async (payload: MiniAppChatPayload) => {
        console.log('MiniAppChat, SUBSCRIBE PAYLOAD', payload);

        if (payload.status === 'error') {
          const validationErrorMessage = await validateSchema(
            chatErrorPayloadSchema,
            payload,
          );

          if (!validationErrorMessage) {
            console.log('Payload is valid');
          } else {
            console.error(validationErrorMessage);
          }
        } else {
          const validationErrorMessage = await validateSchema(
            chatSuccessPayloadSchema,
            payload,
          );

          // This checks if the response format is correct
          if (!validationErrorMessage) {
            console.log('Payload is valid');
          } else {
            console.error(validationErrorMessage);
          }
        }

        setSentChatPayload(payload);
      },
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppChat);
    };
  }, []);

  const onSendChat = useCallback(() => {
    const chatPayload: ChatPayload = {
      ...(toAddress && { to: toAddress.split(',').map((addr) => addr.trim()) }),
      ...(message && { message }),
    };

    const payload = MiniKit.commands.chat(chatPayload);

    setSentChatPayload({
      sent: payload,
    });
  }, [toAddress, message]);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Open Chat</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces max-h-[250px] overflow-y-scroll ">
              {JSON.stringify(sentChatPayload, null, 2)}
            </pre>
          </div>
        </div>

        <div className="grid gap-y-2">
          <input
            type="text"
            placeholder="To: address or username (comma-separated)"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="border-2 border-gray-400 rounded-lg p-2"
          />

          <textarea
            placeholder="Message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border-2 border-gray-400 rounded-lg p-2 min-h-[80px]"
          />

          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={onSendChat}
          >
            Open Chat
          </button>
        </div>
      </div>
    </div>
  );
};
