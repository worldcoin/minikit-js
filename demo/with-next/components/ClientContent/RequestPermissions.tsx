import {
  MiniKit,
  MiniKitRequestPermissionOptions,
  Permission,
  RequestPermissionErrorCodes,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useState } from 'react';
import * as yup from 'yup';

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

  const onRequestPermission = useCallback(async (permission: Permission) => {
    const requestPermissionPayload: MiniKitRequestPermissionOptions = {
        permission,
        fallback() {
          if (permission === Permission.Notifications) {
            return Notification.requestPermission().then((result) => {
              if (result === 'granted') {
                return {
                  status: 'success' as const,
                  version: 1,
                  permission,
                  timestamp: new Date().toISOString(),
                };
              } else {
                return {
                  status: 'error' as const,
                  version: 1,
                  error_code: RequestPermissionErrorCodes.UserRejected,
                  description: 'User denied the permission',
                };
              }
            });
          } else if (permission === Permission.Microphone) {
            return navigator.mediaDevices
              .getUserMedia({ audio: true })
              .then(() => {
                return {
                  status: 'success' as const,
                  version: 1,
                  permission,
                  timestamp: new Date().toISOString(),
                };
              })
              .catch(() => {
                return {
                  status: 'error' as const,
                  version: 1,
                  error_code: RequestPermissionErrorCodes.UserRejected,
                  description: 'User denied the permission or an error occurred',
                };
              });
          } else {
            return Promise.resolve({
              status: 'error' as const,
              version: 1,
              error_code: RequestPermissionErrorCodes.UnsupportedPermission,
              description:
                'The requested permission is not supported in the fallback',
            });
          }
        },
      };

    const payload = await MiniKit.requestPermission(requestPermissionPayload);
    setSentRequestPermissionPayload({
      payload,
    });

    if (payload.executedWith === 'minikit') {
      const response = payload.data;
      setRequestPermissionAppPayload(JSON.stringify(response, null, 2));
      if (response.status === 'success') {
        setRequestPermissionPayloadValidationMessage('Permission granted');
      } else {
        setRequestPermissionPayloadValidationMessage('Permission denied');
      }
    } else {
      setRequestPermissionPayloadValidationMessage(
        'Executed with fallback, no validation available',
      );
    }
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
