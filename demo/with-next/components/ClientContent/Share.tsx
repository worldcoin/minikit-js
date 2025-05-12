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

export const ShareFiles = () => {
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
        <h2 className="text-2xl font-bold">Share Files</h2>

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
                  'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
                  'uno.jpg',
                  'image/jpeg',
                );
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
                  createFileFromUrl(
                    'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
                    'uno.jpg',
                    'image/jpeg',
                  ),
                  createFileFromUrl(
                    'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/2470d701-2094-4bbb-92c2-335e9998a286.jpg',
                    'dos.jpg',
                    'image/jpeg',
                  ),
                  createFileFromUrl(
                    'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/4424dc1e-8905-46b6-a55d-5f6b89f69f63.jpg',
                    'tres.jpg',
                    'image/jpeg',
                  ),
                ]);
                onSendShareFiles({
                  files: filesToShare,
                  title: 'Share three JPGs',
                  text: 'Share three JPGs',
                });
              } catch (error) {
                console.error('Error sharing three JPGs:', error);
              }
            }}
          >
            Three JPGs
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                const filesToShare = await Promise.all([
                  createFileFromUrl(
                    'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
                    'uno.jpg',
                    'image/jpeg',
                  ),
                  createFileFromUrl(
                    'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/65b641e9-8a56-4920-b01c-5c5ae4dbc159.png',
                    'tres.png',
                    'image/png',
                  ),
                ]);
                onSendShareFiles({
                  files: filesToShare,
                  title: 'Share JPG + PNG',
                  text: 'Share JPG + PNG (intended as image/*, types set individually)',
                });
              } catch (error) {
                console.error('Error sharing JPG + PNG:', error);
              }
            }}
          >
            JPG + PNG (image/*)
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                const filesToShare = await Promise.all([
                  createFileFromUrl(
                    'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
                    'uno.jpg',
                    'image/jpeg',
                  ),
                  createFileFromUrl(
                    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    'dummy.pdf',
                    'application/pdf',
                  ),
                ]);
                onSendShareFiles({
                  files: filesToShare,
                  title: 'Share JPG + PDF',
                  text: 'Share JPG + PDF (intended as image/*, types set individually)',
                });
              } catch (error) {
                console.error('Error sharing JPG + PDF (image/*):', error);
              }
            }}
          >
            JPG + PDF (image/*)
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                const filesToShare = await Promise.all([
                  createFileFromUrl(
                    'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
                    'uno.jpg',
                    'image/jpeg',
                  ),
                  createFileFromUrl(
                    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    'dummy.pdf',
                    'application/pdf',
                  ),
                ]);
                onSendShareFiles({
                  files: filesToShare,
                  title: 'Share JPG + PDF',
                  text: 'Share JPG + PDF (intended as */*, types set individually)',
                });
              } catch (error) {
                console.error('Error sharing JPG + PDF (*/*):', error);
              }
            }}
          >
            JPG + PDF (*/*)
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={async () => {
              try {
                onSendShareFiles({
                  title: 'URL',
                  text: 'A URL to share ',
                  url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
                });
              } catch (error) {
                console.error('Error sharing JPG no file extension:', error);
              }
            }}
          >
            URL with title and text
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
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
