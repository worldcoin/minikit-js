import {
  AttestationErrorCodes,
  AttestationPayload,
  MiniAppAttestationPayload,
  MiniKit,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const attestationSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().oneOf(['success']),
  token: yup.string().required(),
  version: yup.number().required(),
});

const attestationErrorPayloadSchema = yup.object({
  error_code: yup
    .string<AttestationErrorCodes>()
    .oneOf(Object.values(AttestationErrorCodes))
    .required(),
  status: yup.string<'error'>().equals(['error']).required(),
  description: yup.string().required(),
  version: yup.number().required(),
});

export const Attestation = () => {
  const [sentAttestationPayload, setSentAttestationPayload] = useState<Record<
    string,
    any
  > | null>(null);
  const [requestHash, setRequestHash] = useState<string>('');

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppAttestation,
      async (payload: MiniAppAttestationPayload) => {
        console.log('MiniAppAttestation, SUBSCRIBE PAYLOAD', payload);

        if (payload.status === 'error') {
          const validationErrorMessage = await validateSchema(
            attestationErrorPayloadSchema,
            payload,
          );

          if (!validationErrorMessage) {
            console.log('Payload is valid');
          } else {
            console.error(validationErrorMessage);
          }
        } else {
          const validationErrorMessage = await validateSchema(
            attestationSuccessPayloadSchema,
            payload,
          );

          if (!validationErrorMessage) {
            console.log('Payload is valid');
          } else {
            console.error(validationErrorMessage);
          }
        }

        setSentAttestationPayload(payload);
      },
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppAttestation);
    };
  }, []);

  const onRequestAttestation = useCallback(() => {
    const attestationPayload: AttestationPayload = {
      requestHash: requestHash || '',
    };

    const payload = MiniKit.commands.attestation(attestationPayload);

    setSentAttestationPayload({
      sent: payload,
    });
  }, [requestHash]);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Attestation</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces max-h-[250px] overflow-y-scroll ">
              {JSON.stringify(sentAttestationPayload, null, 2)}
            </pre>
          </div>
        </div>

        <div className="grid gap-y-2">
          <input
            type="text"
            placeholder="Request hash (Base64URL-encoded)"
            value={requestHash}
            onChange={(e) => setRequestHash(e.target.value)}
            className="border-2 border-gray-400 rounded-lg p-2"
          />

          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={onRequestAttestation}
          >
            Request Attestation
          </button>
        </div>
      </div>
    </div>
  );
};
