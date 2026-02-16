import {
  GetPermissionsErrorCodes,
  MiniKit,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';
const getPermissionsSuccessPayloadSchema = yup.object({
  status: yup.string().equals(['success']).required(),
  version: yup.number().required(),
  permissions: yup.object().required(),
  timestamp: yup.string().required(),
});
const getPermissionsErrorPayloadSchema = yup.object({
  error_code: yup
    .string()
    .oneOf(Object.values(GetPermissionsErrorCodes))
    .required(),
  details: yup.string().required(),
  status: yup.string().equals(['error']).required(),
  version: yup.number().required(),
});
export const GetPermissions = () => {
  const [getPermissionsAppPayload, setGetPermissionsAppPayload] = useState();
  const [
    getPermissionsPayloadValidationMessage,
    setGetPermissionsPayloadValidationMessage,
  ] = useState();
  const [sentGetPermissionsPayload, setSentGetPermissionsPayload] =
    useState(null);
  const [tempInstallFix, setTempInstallFix] = useState(0);
  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    MiniKit.subscribe(ResponseEvent.MiniAppGetPermissions, async (payload) => {
      console.log('MiniAppGetPermissions, SUBSCRIBE PAYLOAD', payload);
      setGetPermissionsAppPayload(JSON.stringify(payload, null, 2));
      if (payload.status === 'error') {
        const errorMessage = await validateSchema(
          getPermissionsErrorPayloadSchema,
          payload,
        );
        if (!errorMessage) {
          setGetPermissionsPayloadValidationMessage('Payload is valid');
        } else {
          setGetPermissionsPayloadValidationMessage(errorMessage);
        }
      } else {
        const errorMessage = await validateSchema(
          getPermissionsSuccessPayloadSchema,
          payload,
        );
        // This checks if the response format is correct
        if (!errorMessage) {
          setGetPermissionsPayloadValidationMessage('Payload is valid');
        } else {
          setGetPermissionsPayloadValidationMessage(errorMessage);
        }
      }
    });
    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppGetPermissions);
    };
  }, [tempInstallFix]);
  const onGetPermissions = useCallback(async () => {
    const payload = MiniKit.getPermissions();
    setSentGetPermissionsPayload({
      payload,
    });
    console.log('payload', payload);
    setTempInstallFix((prev) => prev + 1);
  }, []);
  return _jsxs('div', {
    children: [
      _jsxs('div', {
        className: 'grid gap-y-2',
        children: [
          _jsx('h2', {
            className: 'text-2xl font-bold',
            children: 'Get Permissions',
          }),
          _jsx('div', {
            children: _jsx('div', {
              className: 'bg-gray-300 min-h-[100px] p-2',
              children: _jsx('pre', {
                className: 'break-all whitespace-break-spaces',
                children: JSON.stringify(sentGetPermissionsPayload, null, 2),
              }),
            }),
          }),
          _jsx('div', {
            className: 'grid gap-4 grid-cols-2',
            children: _jsx('button', {
              className: 'bg-black text-white rounded-lg p-4 w-full',
              onClick: () => onGetPermissions(),
              children: 'Get Permissions',
            }),
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
              ResponseEvent.MiniAppGetPermissions,
              '" ',
            ],
          }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: getPermissionsAppPayload ?? JSON.stringify(null),
            }),
          }),
          _jsxs('div', {
            className: 'grid gap-y-2',
            children: [
              _jsx('p', { children: 'Response Validation:' }),
              _jsx('p', {
                className: 'bg-gray-300 p-2',
                children:
                  getPermissionsPayloadValidationMessage ?? 'No validation',
              }),
            ],
          }),
        ],
      }),
    ],
  });
};
