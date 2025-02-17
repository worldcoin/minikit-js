import {
  GetPermissionsErrorCodes,
  MiniKit,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const getPermissionsSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().equals(['success']).required(),
  version: yup.number().required(),
  permissions: yup.object().required(),
  timestamp: yup.string().required(),
});

const getPermissionsErrorPayloadSchema = yup.object({
  error_code: yup
    .string<GetPermissionsErrorCodes>()
    .oneOf(Object.values(GetPermissionsErrorCodes))
    .required(),
  details: yup.string().required(),
  status: yup.string<'error'>().equals(['error']).required(),
  version: yup.number().required(),
});

export const GetPermissions = () => {
  const [getPermissionsAppPayload, setGetPermissionsAppPayload] = useState<
    string | undefined
  >();

  const [
    getPermissionsPayloadValidationMessage,
    setGetPermissionsPayloadValidationMessage,
  ] = useState<string | null>();

  const [sentGetPermissionsPayload, setSentGetPermissionsPayload] =
    useState<Record<string, any> | null>(null);

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
    const payload = MiniKit.commands.getPermissions();
    setSentGetPermissionsPayload({
      payload,
    });
    console.log('payload', payload);
    setTempInstallFix((prev) => prev + 1);
  }, []);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Get Permissions</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(sentGetPermissionsPayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => onGetPermissions()}
          >
            Get Permissions
          </button>
        </div>
      </div>

      <hr />

      <div className="w-full grid gap-y-2">
        <p>Message from &quot;{ResponseEvent.MiniAppGetPermissions}&quot; </p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {getPermissionsAppPayload ?? JSON.stringify(null)}
          </pre>
        </div>

        <div className="grid gap-y-2">
          <p>Response Validation:</p>
          <p className="bg-gray-300 p-2">
            {getPermissionsPayloadValidationMessage ?? 'No validation'}
          </p>
        </div>
      </div>
    </div>
  );
};
