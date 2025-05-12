import {
  MiniAppSharePayload,
  MiniKit,
  SendHapticFeedbackErrorCodes,
  ShareInput,
} from '@worldcoin/minikit-js';
import { useCallback, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const createFileFromUrl = async (
  url: string,
  name: string,
  type: string,
): Promise<File> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from ${url}: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new File([blob], name, { type });
};

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

export const Share = () => {
  const [sentShareFilesPayload, setSentShareFilesPayload] = useState<Record<
    string,
    any
  > | null>(null);

  const validateResponse = async (payload: MiniAppSharePayload) => {
    console.log('MiniAppShare, SUBSCRIBE PAYLOAD', payload);

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
  };

  const onSendShareFiles = useCallback(async (input: ShareInput) => {
    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.share(input);

    setSentShareFilesPayload({
      commandPayload,
    });

    await validateResponse(finalPayload);
  }, []);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Share</h2>
        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces max-h-[250px] overflow-y-scroll ">
              {JSON.stringify(sentShareFilesPayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                const imageFile = await createFileFromUrl(
                  '/800.jpeg',
                  '800.jpeg',
                  'image/jpeg',
                );
                console.log('imageFile', imageFile);
                onSendShareFiles({
                  files: [imageFile],
                  title: 'Share one JPG',
                  text: 'Share one JPG',
                });
              } catch (error) {
                console.error('Error sharing one JPG:', error);
                // Optionally, update UI to show error
              }
            }}
          >
            One JPG
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                const filesToShare = await Promise.all([
                  createFileFromUrl('/marble.png', 'marble.png', 'image/png'),
                  createFileFromUrl('/test.png', 'test.png', 'image/png'),
                ]);
                onSendShareFiles({
                  files: filesToShare,
                  title: 'Share two PNGs',
                  text: 'Share two PNGs',
                });
              } catch (error) {
                console.error('Error sharing three JPGs:', error);
              }
            }}
          >
            Two PNGs
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                const filesToShare = await Promise.all([
                  createFileFromUrl('/800.jpeg', '800.jpeg', 'image/jpeg'),
                  createFileFromUrl('/test.png', 'test.png', 'image/png'),
                ]);
                onSendShareFiles({
                  files: filesToShare,
                  title: 'Share JPG + PNG',
                  text: 'Share JPG + PNG ',
                });
              } catch (error) {
                console.error('Error sharing JPG + PNG:', error);
              }
            }}
          >
            JPG + PNG
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                const filesToShare = await Promise.all([
                  createFileFromUrl('/800.jpeg', '800.jpeg', 'image/jpeg'),
                  createFileFromUrl(
                    '/dummy.pdf',
                    'dummy.pdf',
                    'application/pdf',
                  ),
                ]);
                onSendShareFiles({
                  files: filesToShare,
                  title: 'Share JPG + PDF',
                  text: 'Share JPG + PDF ',
                });
              } catch (error) {
                console.error('Error sharing JPG + PDF (image/*):', error);
              }
            }}
          >
            JPG + PDF
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                onSendShareFiles({
                  title: 'URL',
                  text: 'A URL to share',
                  url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
                });
              } catch (error) {
                console.error('Error sharing JPG no file extension:', error);
              }
            }}
          >
            URL with title and text
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                // convert audio to file using /money.mp3
                const audioFile = await createFileFromUrl(
                  '/money.mp3',
                  'money.mp3',
                  'audio/mp3',
                );

                onSendShareFiles({
                  files: [audioFile],
                  title: 'Share MP3',
                  text: 'Share MP3',
                });
              } catch (error) {
                console.error('Error sharing JPG with special name:', error);
              }
            }}
          >
            MP3 from Local
          </button>
        </div>
      </div>
    </div>
  );
};
