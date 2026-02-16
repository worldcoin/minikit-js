import { ChatErrorCodes, MiniKit, ResponseEvent } from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';
const chatSuccessPayloadSchema = yup.object({
  status: yup.string().oneOf(['success']),
  count: yup.number().required(),
  timestamp: yup.string().required(),
  version: yup.number().required(),
});
const chatErrorPayloadSchema = yup.object({
  error_code: yup.string().oneOf(Object.values(ChatErrorCodes)).required(),
  status: yup.string().equals(['error']).required(),
  version: yup.number().required(),
});
export const Chat = () => {
  const [sentChatPayload, setSentChatPayload] = useState(null);
  const [toAddress, setToAddress] = useState('');
  const [message, setMessage] = useState('Hello from MiniKit!');
  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    MiniKit.subscribe(ResponseEvent.MiniAppChat, async (payload) => {
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
    });
    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppChat);
    };
  }, []);
  const onSendChat = useCallback(async () => {
    const chatPayload = {
      message: message || '',
      ...(toAddress && { to: toAddress.split(',').map((addr) => addr.trim()) }),
      fallback: () => {
        return {
          status: 'success',
          version: 1,
          count: toAddress ? toAddress.split(',').length : 1,
          timestamp: new Date().toISOString(),
        };
      },
    };
    const payload = await MiniKit.chat(chatPayload);
    payload;
    setSentChatPayload({
      sent: chatPayload,
    });
  }, [toAddress, message]);
  return _jsx('div', {
    children: _jsxs('div', {
      className: 'grid gap-y-2',
      children: [
        _jsx('h2', { className: 'text-2xl font-bold', children: 'Open Chat' }),
        _jsx('div', {
          children: _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className:
                'break-all whitespace-break-spaces max-h-[250px] overflow-y-scroll ',
              children: JSON.stringify(sentChatPayload, null, 2),
            }),
          }),
        }),
        _jsxs('div', {
          className: 'grid gap-y-2',
          children: [
            _jsx('input', {
              type: 'text',
              placeholder: 'To: address or username (comma-separated)',
              value: toAddress,
              onChange: (e) => setToAddress(e.target.value),
              className: 'border-2 border-gray-400 rounded-lg p-2',
            }),
            _jsx('textarea', {
              placeholder: 'Message (optional)',
              value: message,
              onChange: (e) => setMessage(e.target.value),
              className: 'border-2 border-gray-400 rounded-lg p-2 min-h-[80px]',
            }),
            _jsx('button', {
              className: 'bg-black text-white rounded-lg p-4 w-full',
              onClick: onSendChat,
              children: 'Open Chat',
            }),
          ],
        }),
      ],
    }),
  });
};
