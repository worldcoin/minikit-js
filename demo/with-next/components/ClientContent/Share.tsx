// import {
//   MiniAppShareFilesPayload,
//   MiniKit,
//   SendHapticFeedbackErrorCodes,
//   ShareFilesInput,
// } from '@worldcoin/minikit-js';
// import { useCallback, useState } from 'react';
// import * as yup from 'yup';
// import { validateSchema } from './helpers/validate-schema';

// const sendHapticFeedbackSuccessPayloadSchema = yup.object({
//   status: yup.string<'success'>().oneOf(['success']),
// });

// const sendHapticFeedbackErrorPayloadSchema = yup.object({
//   error_code: yup
//     .string<SendHapticFeedbackErrorCodes>()
//     .oneOf(Object.values(SendHapticFeedbackErrorCodes))
//     .required(),
//   status: yup.string<'error'>().equals(['error']).required(),
//   version: yup.number().required(),
// });

// export const ShareFiles = () => {
//   const [sentShareFilesPayload, setSentShareFilesPayload] = useState<Record<
//     string,
//     any
//   > | null>(null);

//   const validateResponse = async (payload: MiniAppShareFilesPayload) => {
//     console.log('MiniAppShareFiles, SUBSCRIBE PAYLOAD', payload);

//     if (payload.status === 'error') {
//       const validationErrorMessage = await validateSchema(
//         sendHapticFeedbackErrorPayloadSchema,
//         payload,
//       );

//       if (!validationErrorMessage) {
//         console.log('Payload is valid');
//       } else {
//         console.error(validationErrorMessage);
//       }
//     } else {
//       const validationErrorMessage = await validateSchema(
//         sendHapticFeedbackSuccessPayloadSchema,
//         payload,
//       );

//       // This checks if the response format is correct
//       if (!validationErrorMessage) {
//         console.log('Payload is valid');
//       } else {
//         console.error(validationErrorMessage);
//       }
//     }
//   };

//   const onSendShareFiles = useCallback(async (input: ShareFilesInput) => {
//     const { commandPayload, finalPayload } =
//       await MiniKit.commandsAsync.shareFiles(input);

//     setSentShareFilesPayload({
//       commandPayload,
//     });

//     await validateResponse(finalPayload);
//   }, []);

//   return (
//     <div>
//       <div className="grid gap-y-2">
//         <h2 className="text-2xl font-bold">Share Files</h2>

//         <div>
//           <div className="bg-gray-300 min-h-[100px] p-2">
//             <pre className="break-all whitespace-break-spaces max-h-[250px] overflow-y-scroll ">
//               {JSON.stringify(sentShareFilesPayload, null, 2)}
//             </pre>
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-2">
//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() =>
//               onSendShareFiles({
//                 files: [
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
//                     saved_file_name_with_extension: 'uno.jpg',
//                   },
//                 ],
//                 mime_type: 'image/jpeg',
//               })
//             }
//           >
//             One JPG
//           </button>
//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() =>
//               onSendShareFiles({
//                 files: [
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
//                     saved_file_name_with_extension: 'uno.jpg',
//                   },
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/2470d701-2094-4bbb-92c2-335e9998a286.jpg',
//                     saved_file_name_with_extension: 'dos.jpg',
//                   },
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/4424dc1e-8905-46b6-a55d-5f6b89f69f63.jpg',
//                     saved_file_name_with_extension: 'tres.jpg',
//                   },
//                 ],
//                 mime_type: 'image/jpeg',
//               })
//             }
//           >
//             Three JPGs
//           </button>
//         </div>
//         <div className="grid grid-cols-2 gap-2">
//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() =>
//               onSendShareFiles({
//                 files: [
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
//                     saved_file_name_with_extension: 'uno.jpg',
//                   },
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/65b641e9-8a56-4920-b01c-5c5ae4dbc159.png',
//                     saved_file_name_with_extension: 'tres.png',
//                   },
//                 ],
//                 mime_type: 'image/*',
//               })
//             }
//           >
//             JPG + PNG (image/*)
//           </button>
//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() =>
//               onSendShareFiles({
//                 files: [
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
//                     saved_file_name_with_extension: 'uno.jpg',
//                   },
//                   {
//                     url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
//                     saved_file_name_with_extension: 'dummy.pdf',
//                   },
//                 ],
//                 mime_type: 'image/*',
//               })
//             }
//           >
//             JPG + PDF (image/*)
//           </button>
//         </div>
//         <div className="grid grid-cols-2 gap-2">
//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() =>
//               onSendShareFiles({
//                 files: [
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
//                     saved_file_name_with_extension: 'uno.jpg',
//                   },
//                   {
//                     url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
//                     saved_file_name_with_extension: 'dummy.pdf',
//                   },
//                 ],
//                 mime_type: '*/*',
//               })
//             }
//           >
//             JPG + PDF (*/*)
//           </button>
//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() =>
//               onSendShareFiles({
//                 files: [
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
//                     saved_file_name_with_extension: 'uno',
//                   },
//                 ],
//                 mime_type: 'image/jpeg',
//               })
//             }
//           >
//             JPG no file extension
//           </button>
//         </div>
//         <div className="grid grid-cols-2 gap-2">
//           <button
//             className="bg-black text-white rounded-lg p-4 w-full"
//             onClick={() =>
//               onSendShareFiles({
//                 files: [
//                   {
//                     url: 'https://world-id-assets.com/app_a4f7f3e62c1de0b9490a5260cb390b56/9185e1fd-c902-4799-aacb-973ef290fe56.jpg',
//                     saved_file_name_with_extension: 'uno*&1<?.jpg',
//                   },
//                 ],
//                 mime_type: 'image/jpeg',
//               })
//             }
//           >
//             {'uno*&1<?.jpg'} name
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };
