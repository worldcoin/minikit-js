import {
  MiniKit,
  Permission,
  RequestPermissionErrorCodes,
  RequestPermissionPayload,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const requestPermissionSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().equals(['success']).required(),
  version: yup.number().required(),
  permission: yup.string<Permission>().oneOf(Object.values(Permission)),
  timestamp: yup.string().required(),
});

const requestPermissionErrorPayloadSchema = yup.object({
  error_code: yup
    .string<RequestPermissionErrorCodes>()
    .oneOf(Object.values(RequestPermissionErrorCodes))
    .required(),
  description: yup.string().required(),
  status: yup.string<'error'>().equals(['error']).required(),
  version: yup.number().required(),
});

export const RequestPermission = () => {
  const [requestPermissionAppPayload, setRequestPermissionAppPayload] =
    useState<string | undefined>();

  const [
    requestPermissionPayloadValidationMessage,
    setRequestPermissionPayloadValidationMessage,
  ] = useState<string | null>();

  const [sentRequestPermissionPayload, setSentRequestPermissionPayload] =
    useState<Record<string, any> | null>(null);

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

  const onRequestPermission = useCallback(async (permission: Permission) => {
    const requestPermissionPayload: RequestPermissionPayload = {
      permission,
    };

    const payload = MiniKit.commands.requestPermission(
      requestPermissionPayload,
    );
    setSentRequestPermissionPayload({
      payload,
    });
    console.log('payload', payload);
    setTempInstallFix((prev) => prev + 1);
  }, []);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Request Permission</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(sentRequestPermissionPayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => onRequestPermission(Permission.Notifications)}
          >
            Request Notifications
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => onRequestPermission(Permission.Microphone)}
          >
            Request Microphone
          </button>
        </div>
      </div>

      <hr />

      <div className="w-full grid gap-y-2">
        <p>
          Message from &quot;{ResponseEvent.MiniAppRequestPermission}&quot;{' '}
        </p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {requestPermissionAppPayload ?? JSON.stringify(null)}
          </pre>
        </div>

        <div className="grid gap-y-2">
          <p>Response Validation:</p>
          <p className="bg-gray-300 p-2">
            {requestPermissionPayloadValidationMessage ?? 'No validation'}
          </p>
        </div>
      </div>
    </div>
  );
};
