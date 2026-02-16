import Safe, { hashSafeMessage } from '@safe-global/protocol-kit';
import {
  MiniKit,
  MiniKitSignTypedDataOptions,
  ResponseEvent,
} from '@worldcoin/minikit-js';
import { useCallback, useState } from 'react';
import { verifyTypedData } from 'viem';

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
    verifyingContract: '0xd809de3086Ea4f53ed3979CEad25e1Ff72b564a3' as const,
    chainId: 480,
  },
  primaryType: 'SafeTx',
  message: {
    to: '0x163f8c2467924be0ae7b5347228cabf260318753' as const,
    value: '0',
    data: '0xa9059cbb000000000000000000000000deaddeaddeaddeaddeaddeaddeaddeaddead00010000000000000000000000000000000000000000000000010001000001000001' as const,
    operation: 0,
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000' as const,
    refundReceiver: '0x0000000000000000000000000000000000000000' as const,
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
    verifyingContract: '0xd809de3086Ea4f53ed3979CEad25e1Ff72b564a3' as const,
    chainId: 480,
  },
  primaryType: 'SafeTx',
  message: {
    to: '0xd809de3086Ea4f53ed3979CEad25e1Ff72b564a3' as const,
    value: 0,
    data: '0x0d582f13000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000002' as const,
    operation: 0,
    safeTxGas: 0,
    baseGas: 0,
    gasPrice: 0,
    gasToken: '0x0000000000000000000000000000000000000000' as const,
    refundReceiver: '0x0000000000000000000000000000000000000000' as const,
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

const toSafeEip712TypedData = (
  input: MiniKitSignTypedDataOptions,
): {
  types: Record<string, unknown>;
  primaryType: string;
  domain: Record<string, unknown>;
  message: Record<string, unknown>;
} => ({
  types: input.types as Record<string, unknown>,
  primaryType: input.primaryType,
  domain: {
    ...(input.domain ? (input.domain as Record<string, unknown>) : {}),
    ...(input.chainId !== undefined ? { chainId: input.chainId } : {}),
  },
  message: input.message as Record<string, unknown>,
});

export const SignTypedData = () => {
  const [signTypedDataAppPayload, setSignTypedDataAppPayload] = useState<
    string | undefined
  >();

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

  const onSignTypedData = useCallback(async (stateChanges?: boolean) => {
    const signTypedDataInput: MiniKitSignTypedDataOptions = stateChanges
      ? stateChangesPayload
      : signTypedDataPayload;

    setSentSignTypedDataPayload({
      signTypedDataInput,
    });
    const payload = await MiniKit.signTypedData(signTypedDataInput);
    setSignTypedDataAppPayload(JSON.stringify(payload.data, null, 2));
    setSignTypedDataPayloadValidationMessage('Payload is valid');

    if (payload.executedWith === 'minikit') {
      const response = payload.data;
      const messageHash = hashSafeMessage(
        toSafeEip712TypedData(signTypedDataInput) as any,
      );

      const isValid = await (
        await Safe.init({
          provider: 'https://worldchain-mainnet.g.alchemy.com/public',
          safeAddress: response.address,
        })
      ).isValidSignature(messageHash, response.signature);

      setSignTypedDataPayloadVerificationMessage(
        isValid ? 'Signature is valid' : 'Signature is invalid',
      );
      return;
    }

    if (payload.executedWith === 'wagmi') {
      const response = payload.data;

      const isValid = await verifyTypedData({
        address: response.address as `0x${string}`,
        types: signTypedDataInput.types as Record<string, any>,
        primaryType: signTypedDataInput.primaryType as any,
        domain: signTypedDataInput.domain as Record<string, any> | undefined,
        message: signTypedDataInput.message as Record<string, any>,
        signature: response.signature as `0x${string}`,
      });

      setSignTypedDataPayloadVerificationMessage(
        isValid ? 'Signature is valid' : 'Signature is invalid',
      );
      return;
    }

    setSignTypedDataPayloadVerificationMessage('Signature is invalid');
  }, []);

  const signBenignPayload = async (chainId?: number) => {
    const signTypedDataPayload: MiniKitSignTypedDataOptions = {
      ...benignPayload,
      chainId,
    };

    setSentSignTypedDataPayload(signTypedDataPayload);
    const payload = await MiniKit.signTypedData({
      ...benignPayload,
      chainId,
    });
    setSignTypedDataAppPayload(JSON.stringify(payload.data, null, 2));
    setSignTypedDataPayloadValidationMessage('Payload is valid');

    if (payload.executedWith === 'minikit') {
      const messageHash = hashSafeMessage(
        toSafeEip712TypedData({
          ...benignPayload,
          chainId,
        }) as any,
      );

      const isValid = await (
        await Safe.init({
          provider: 'https://worldchain-mainnet.g.alchemy.com/public',
          safeAddress: payload.data.address,
        })
      ).isValidSignature(messageHash, payload.data.signature);

      setSignTypedDataPayloadVerificationMessage(
        isValid ? 'Signature is valid' : 'Signature is invalid',
      );
      return;
    }

    if (payload.executedWith === 'wagmi') {
      const isValid = await verifyTypedData({
        address: payload.data.address as `0x${string}`,
        types: benignPayload.types as Record<string, any>,
        primaryType: benignPayload.primaryType as any,
        domain: benignPayload.domain as Record<string, any> | undefined,
        message: benignPayload.message as Record<string, any>,
        signature: payload.data.signature as `0x${string}`,
      });

      setSignTypedDataPayloadVerificationMessage(
        isValid ? 'Signature is valid' : 'Signature is invalid',
      );
      return;
    }

    setSignTypedDataPayloadVerificationMessage('Signature is invalid');
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
