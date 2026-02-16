import {
  MiniKit,
  Permission,
  RequestPermissionErrorCodes,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';
const requestPermissionSuccessPayloadSchema = yup.object({
  status: yup.string().equals(['success']).required(),
  version: yup.number().required(),
  permission: yup.string().oneOf(Object.values(Permission)),
  timestamp: yup.string().required(),
});
const requestPermissionErrorPayloadSchema = yup.object({
  error_code: yup
    .string()
    .oneOf(Object.values(RequestPermissionErrorCodes))
    .required(),
  description: yup.string().required(),
  status: yup.string().equals(['error']).required(),
  version: yup.number().required(),
});
export const RequestPermission = () => {
  const [requestPermissionAppPayload, setRequestPermissionAppPayload] =
    useState();
  const [
    requestPermissionPayloadValidationMessage,
    setRequestPermissionPayloadValidationMessage,
  ] = useState();
  const [sentRequestPermissionPayload, setSentRequestPermissionPayload] =
    useState(null);
  const [tempInstallFix, setTempInstallFix] = useState(0);
  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    MiniKit.subscribe(
      ResponseEvent.MiniAppRequestPermission,
      async (payload) => {
        console.log('MiniAppRequestPermission, SUBSCRIBE PAYLOAD', payload);
        setRequestPermissionAppPayload(JSON.stringify(payload, null, 2));
        if (payload.status === 'error') {
          const errorMessage = await validateSchema(
            requestPermissionErrorPayloadSchema,
            payload,
          );
          if (!errorMessage) {
            setRequestPermissionPayloadValidationMessage('Payload is valid');
          } else {
            setRequestPermissionPayloadValidationMessage(errorMessage);
          }
        } else {
          const errorMessage = await validateSchema(
            requestPermissionSuccessPayloadSchema,
            payload,
          );
          // This checks if the response format is correct
          if (!errorMessage) {
            setRequestPermissionPayloadValidationMessage('Payload is valid');
          } else {
            setRequestPermissionPayloadValidationMessage(errorMessage);
          }
        }
      },
    );
    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppRequestPermission);
    };
  }, [tempInstallFix]);
  const onRequestPermission = useCallback(async (permission) => {
    const requestPermissionPayload = {
      permission,
    };
    const payload = MiniKit.requestPermission(requestPermissionPayload);
    setSentRequestPermissionPayload({
      payload,
    });
    setTempInstallFix((prev) => prev + 1);
  }, []);
  return _jsxs('div', {
    children: [
      _jsxs('div', {
        className: 'grid gap-y-2',
        children: [
          _jsx('h2', {
            className: 'text-2xl font-bold',
            children: 'Request Permission',
          }),
          _jsx('div', {
            children: _jsx('div', {
              className: 'bg-gray-300 min-h-[100px] p-2',
              children: _jsx('pre', {
                className: 'break-all whitespace-break-spaces',
                children: JSON.stringify(sentRequestPermissionPayload, null, 2),
              }),
            }),
          }),
          _jsxs('div', {
            className: 'grid gap-4 grid-cols-2',
            children: [
              _jsx('button', {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: () => onRequestPermission(Permission.Notifications),
                children: 'Request Notifications',
              }),
              _jsx('button', {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: () => onRequestPermission(Permission.Microphone),
                children: 'Request Microphone',
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
              ResponseEvent.MiniAppRequestPermission,
              '"',
              ' ',
            ],
          }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: requestPermissionAppPayload ?? JSON.stringify(null),
            }),
          }),
          _jsxs('div', {
            className: 'grid gap-y-2',
            children: [
              _jsx('p', { children: 'Response Validation:' }),
              _jsx('p', {
                className: 'bg-gray-300 p-2',
                children:
                  requestPermissionPayloadValidationMessage ?? 'No validation',
              }),
            ],
          }),
        ],
      }),
    ],
  });
};
