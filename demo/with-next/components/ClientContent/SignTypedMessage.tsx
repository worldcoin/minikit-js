import Safe, { hashSafeMessage } from '@safe-global/protocol-kit';
import {
  MiniAppSignTypedDataPayload,
  MiniKit,
  ResponseEvent,
  SignTypedDataErrorCodes,
} from '@worldcoin/minikit-js';
import { useCallback, useEffect, useState } from 'react';
import * as yup from 'yup';
import { validateSchema } from './helpers/validate-schema';

const signTypedDataSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().oneOf(['success']),
  signature: yup.string().required(),
  address: yup.string().required(),
});

const signTypedDataErrorPayloadSchema = yup.object({
  error_code: yup
    .string<SignTypedDataErrorCodes>()
    .oneOf(Object.values(SignTypedDataErrorCodes))
    .required(),
  status: yup.string<'error'>().equals(['error']).required(),
  version: yup.number().required(),
});

const signTypedDataPayload = {
  types: {
    EIP712Domain: [
      {
        type: 'uint256',
        name: 'chainId',
      },
      {
        type: 'address',
        name: 'verifyingContract',
      },
    ],
    SafeTx: [
      {
        type: 'address',
        name: 'to',
      },
      {
        type: 'uint256',
        name: 'value',
      },
      {
        type: 'bytes',
        name: 'data',
      },
      {
        type: 'uint8',
        name: 'operation',
      },
      {
        type: 'uint256',
        name: 'safeTxGas',
      },
      {
        type: 'uint256',
        name: 'baseGas',
      },
      {
        type: 'uint256',
        name: 'gasPrice',
      },
      {
        type: 'address',
        name: 'gasToken',
      },
      {
        type: 'address',
        name: 'refundReceiver',
      },
      {
        type: 'uint256',
        name: 'nonce',
      },
    ],
  },
  domain: {
    verifyingContract: '0xd809de3086Ea4f53ed3979CEad25e1Ff72b564a3',
    chainId: 480,
  },
  primaryType: 'SafeTx',
  message: {
    to: '0x163f8c2467924be0ae7b5347228cabf260318753',
    value: '0',
    data: '0xa9059cbb000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00010000000000000000000000000000000000000000000000010001000001000001',
    operation: 0,
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: 0,
    safeTxGas: '0',
  },
};

const stateChangesPayload = {
  types: {
    EIP712Domain: [
      { type: 'uint256', name: 'chainId' },
      { type: 'address', name: 'verifyingContract' },
    ],
    SafeTx: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'value' },
      { type: 'bytes', name: 'data' },
      { type: 'uint8', name: 'operation' },
      { type: 'uint256', name: 'safeTxGas' },
      { type: 'uint256', name: 'baseGas' },
      { type: 'uint256', name: 'gasPrice' },
      { type: 'address', name: 'gasToken' },
      { type: 'address', name: 'refundReceiver' },
      { type: 'uint256', name: 'nonce' },
    ],
  },
  domain: {
    verifyingContract: '0xd809de3086Ea4f53ed3979CEad25e1Ff72b564a3',
    chainId: 480,
  },
  primaryType: 'SafeTx',
  message: {
    to: '0xd809de3086Ea4f53ed3979CEad25e1Ff72b564a3',
    value: 0,
    data: '0x0d582f13000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000002',
    operation: 0,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: 0,
  },
};

const benignPayload = {
  types: {
    Multiproposal: [{ name: 'multiproposalMerkleRoot', type: 'bytes32' }],
  },
  primaryType: 'Multiproposal',
  message: {
    multiproposalMerkleRoot:
      '0x25036394ad71c7df18db57d4a48de979fda55b9607eeb5990951d898449a20dc',
  },
  domain: { name: 'PWNMultiproposal' },
};

export const SignTypedData = () => {
  const [signTypedDataAppPayload, setSignTypedDataAppPayload] = useState<
    string | undefined
  >();
  const [tempInstallFix, setTempInstallFix] = useState(0);

  const [
    signTypedDataPayloadValidationMessage,
    setSignTypedDataPayloadValidationMessage,
  ] = useState<string | null>();

  const [
    signTypedDataPayloadVerificationMessage,
    setSignTypedDataPayloadVerificationMessage,
  ] = useState<string | null>();

  const [sentSignTypedDataPayload, setSentSignTypedDataPayload] =
    useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppSignTypedData,
      async (payload: MiniAppSignTypedDataPayload) => {
        console.log('MiniAppSignTypedData, SUBSCRIBE PAYLOAD', payload);
        setSignTypedDataAppPayload(JSON.stringify(payload, null, 2));

        if (payload.status === 'error') {
          const errorMessage = await validateSchema(
            signTypedDataErrorPayloadSchema,
            payload,
          );

          if (!errorMessage) {
            setSignTypedDataPayloadValidationMessage('Payload is valid');
          } else {
            setSignTypedDataPayloadValidationMessage(errorMessage);
          }
        } else {
          const errorMessage = await validateSchema(
            signTypedDataSuccessPayloadSchema,
            payload,
          );

          // This checks if the response format is correct
          if (!errorMessage) {
            setSignTypedDataPayloadValidationMessage('Payload is valid');
          } else {
            setSignTypedDataPayloadValidationMessage(errorMessage);
          }

          const messageHash = hashSafeMessage(signTypedDataPayload);

          const isValid = await (
            await Safe.init({
              provider:
                'https://opt-mainnet.g.alchemy.com/v2/Ha76ahWcm6iDVBU7GNr5n-ONLgzWnkWc',
              safeAddress: payload.address,
            })
          ).isValidSignature(messageHash, payload.signature);

          // Checks functionally if the signature is correct
          if (isValid) {
            setSignTypedDataPayloadVerificationMessage('Signature is valid');
          } else {
            setSignTypedDataPayloadVerificationMessage(
              'Signature is invalid (We are verifying on optimism, if you are using worldchain message andy',
            );
          }
        }
      },
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSignTypedData);
    };
  }, [tempInstallFix]);

  const onSignTypedData = useCallback(async (stateChanges?: boolean) => {
    const payload = MiniKit.commands.signTypedData(
      stateChanges ? stateChangesPayload : signTypedDataPayload,
    );

    setSentSignTypedDataPayload({
      payload,
    });
    setTempInstallFix((prev) => prev + 1);
  }, []);

  const signBenignPayload = (chainId?: number) => {
    const payload = MiniKit.commands.signTypedData({
      ...benignPayload,
      chainId,
    });
    setSentSignTypedDataPayload({
      payload,
    });
    setTempInstallFix((prev) => prev + 1);
  };

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Sign Typed Data</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces max-h-[250px] overflow-y-scroll ">
              {JSON.stringify(sentSignTypedDataPayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3">
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => signBenignPayload()}
          >
            Sign Benign Payload (Worldchain)
          </button>
          <button
            className="bg-black text-white rounded-lg p-4 w-full"
            onClick={() => signBenignPayload(8453)}
          >
            Sign Benign Payload (Base)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-3">
          <button
            className="bg-red-700 text-white rounded-lg p-4 w-full"
            onClick={() => onSignTypedData()}
          >
            Sign Transaction
          </button>
          <button
            className="bg-red-700 text-white rounded-lg p-4 w-full"
            onClick={() => onSignTypedData(true)}
          >
            State Changes <br />
            (Change ownership of safe)
          </button>
        </div>
      </div>

      <hr />

      <div className="w-full grid gap-y-2">
        <p>Message from &quot;{ResponseEvent.MiniAppSignTypedData}&quot; </p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {signTypedDataAppPayload ?? JSON.stringify(null)}
          </pre>
        </div>

        <div className="grid gap-y-2">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {signTypedDataPayloadValidationMessage ?? 'No validation'}
          </p>
        </div>
        <div>
          <p>Check does signature verify:</p>
          <p className="bg-gray-300 p-2">
            {signTypedDataPayloadVerificationMessage ?? 'No verification'}
          </p>
        </div>
      </div>
    </div>
  );
};
