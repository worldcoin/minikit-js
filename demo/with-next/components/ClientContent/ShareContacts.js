import {
  MiniKit,
  ResponseEvent,
  ShareContactsErrorCodes,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';
const shareContactsSuccessPayloadSchema = yup.object({
  status: yup.string().equals(['success']).required(),
  version: yup.number().required(),
  contacts: yup.array().of(yup.object().required()),
});
const shareContactsErrorPayloadSchema = yup.object({
  error_code: yup
    .string()
    .oneOf(Object.values(ShareContactsErrorCodes))
    .required(),
  status: yup.string().equals(['error']).required(),
  version: yup.number().required(),
});
export const ShareContacts = () => {
  const [shareContactsAppPayload, setShareContactsAppPayload] = useState();
  const [
    shareContactsPayloadValidationMessage,
    setShareContactsPayloadValidationMessage,
  ] = useState();
  const [sentShareContactsPayload, setSentShareContactsPayload] =
    useState(null);
  const [tempInstallFix, setTempInstallFix] = useState(0);
  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }
    MiniKit.subscribe(ResponseEvent.MiniAppShareContacts, async (payload) => {
      console.log('MiniAppShareContacts, SUBSCRIBE PAYLOAD', payload);
      setShareContactsAppPayload(JSON.stringify(payload, null, 2));
      if (payload.status === 'error') {
        const errorMessage = await validateSchema(
          shareContactsErrorPayloadSchema,
          payload,
        );
        if (!errorMessage) {
          setShareContactsPayloadValidationMessage('Payload is valid');
        } else {
          setShareContactsPayloadValidationMessage(errorMessage);
        }
      } else {
        const errorMessage = await validateSchema(
          shareContactsSuccessPayloadSchema,
          payload,
        );
        // This checks if the response format is correct
        if (!errorMessage) {
          setShareContactsPayloadValidationMessage('Payload is valid');
        } else {
          setShareContactsPayloadValidationMessage(errorMessage);
        }
      }
    });
    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppShareContacts);
    };
  }, [tempInstallFix]);
  const onShareContacts = useCallback(
    async (isMultiSelectEnabled = false, inviteMessage) => {
      const shareContactsPayload = {
        isMultiSelectEnabled,
        inviteMessage,
      };
      const payload = MiniKit.shareContacts(shareContactsPayload);
      setSentShareContactsPayload({
        payload,
      });
      console.log('payload', payload);
      setTempInstallFix((prev) => prev + 1);
    },
    [],
  );
  return _jsxs('div', {
    children: [
      _jsxs('div', {
        className: 'grid gap-y-2',
        children: [
          _jsx('h2', {
            className: 'text-2xl font-bold',
            children: 'Share Contacts',
          }),
          _jsx('div', {
            children: _jsx('div', {
              className: 'bg-gray-300 min-h-[100px] p-2',
              children: _jsx('pre', {
                className: 'break-all whitespace-break-spaces',
                children: JSON.stringify(sentShareContactsPayload, null, 2),
              }),
            }),
          }),
          _jsxs('div', {
            className: 'grid gap-4 grid-cols-2',
            children: [
              _jsx('button', {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: () => onShareContacts(true),
                children: 'Share Contacts (Multi enabled)',
              }),
              _jsx('button', {
                className: 'bg-black text-white rounded-lg p-4 w-full',
                onClick: () => onShareContacts(false),
                children: 'Share Contacts (multi disabled)',
              }),
            ],
          }),
          _jsx('div', {
            className: 'grid gap-4 grid-cols-2',
            children: _jsx('button', {
              className: 'bg-black text-white rounded-lg p-4 w-full',
              onClick: () => onShareContacts(false, 'hello join worldcoin!'),
              children: 'Share Contacts Invite Message',
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
              ResponseEvent.MiniAppShareContacts,
              '" ',
            ],
          }),
          _jsx('div', {
            className: 'bg-gray-300 min-h-[100px] p-2',
            children: _jsx('pre', {
              className: 'break-all whitespace-break-spaces',
              children: shareContactsAppPayload ?? JSON.stringify(null),
            }),
          }),
          _jsxs('div', {
            className: 'grid gap-y-2',
            children: [
              _jsx('p', { children: 'Response Validation:' }),
              _jsx('p', {
                className: 'bg-gray-300 p-2',
                children:
                  shareContactsPayloadValidationMessage ?? 'No validation',
              }),
            ],
          }),
        ],
      }),
    ],
  });
};
