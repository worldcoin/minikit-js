import {
  Contact,
  MiniKit,
  ResponseEvent,
  ShareContactsErrorCodes,
  ShareContactsPayload,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const shareContactsSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().equals(['success']).required(),
  version: yup.number().required(),
  contacts: yup.array().of(yup.object<Contact>().required()),
});

const shareContactsErrorPayloadSchema = yup.object({
  error_code: yup
    .string<ShareContactsErrorCodes>()
    .oneOf(Object.values(ShareContactsErrorCodes))
    .required(),
  status: yup.string<'error'>().equals(['error']).required(),
  version: yup.number().required(),
});

export const ShareContacts = () => {
  const [shareContactsAppPayload, setShareContactsAppPayload] = useState<
    string | undefined
  >();

  const [
    shareContactsPayloadValidationMessage,
    setShareContactsPayloadValidationMessage,
  ] = useState<string | null>();

  const [sentShareContactsPayload, setSentShareContactsPayload] =
    useState<Record<string, any> | null>(null);

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
    async (isMultiSelectEnabled: boolean = false, inviteMessage?: string) => {
      const shareContactsPayload: ShareContactsPayload = {
        isMultiSelectEnabled,
        inviteMessage,
      };

      const payload = MiniKit.commands.shareContacts(shareContactsPayload);
      setSentShareContactsPayload({
        payload,
      });
      console.log('payload', payload);
      setTempInstallFix((prev) => prev + 1);
    },
    [],
  );

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Share Contacts</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(sentShareContactsPayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => onShareContacts(true)}
          >
            Share Contacts (Multi enabled)
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => onShareContacts(false)}
          >
            Share Contacts (multi disabled)
          </button>
        </div>
        <div className="grid gap-4 grid-cols-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => onShareContacts(false, 'hello join worldcoin!')}
          >
            Share Contacts Invite Message
          </button>
        </div>
      </div>

      <hr />

      <div className="w-full grid gap-y-2">
        <p>Message from &quot;{ResponseEvent.MiniAppShareContacts}&quot; </p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {shareContactsAppPayload ?? JSON.stringify(null)}
          </pre>
        </div>

        <div className="grid gap-y-2">
          <p>Response Validation:</p>
          <p className="bg-gray-300 p-2">
            {shareContactsPayloadValidationMessage ?? 'No validation'}
          </p>
        </div>
      </div>
    </div>
  );
};
