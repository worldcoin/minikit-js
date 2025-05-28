import {
  MiniAppSendTransactionPayload,
  MiniKit,
  ResponseEvent,
  SendTransactionErrorCodes,
  Tokens,
  tokenToDecimals,
  VerificationLevel,
} from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { useState } from 'react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import * as yup from 'yup';
import ANDYABI from '../../abi/Andy.json';
import DEXABI from '../../abi/DEX.json';
import ForwardABI from '../../abi/Forward.json';
import MinikitStaging from '../../abi/MinikitStaging.json';
import { validateSchema } from './helpers/validate-schema';

const sendTransactionSuccessPayloadSchema = yup.object({
  status: yup.string<'success'>().oneOf(['success']),
  transaction_status: yup.string<'submitted'>().oneOf(['submitted']),
  transaction_id: yup.string().required(),
  from: yup.string().optional(),
  chain: yup.string().required(),
  timestamp: yup.string().required(),
});

const sendTransactionErrorPayloadSchema = yup.object({
  error_code: yup
    .string<SendTransactionErrorCodes>()
    .oneOf(Object.values(SendTransactionErrorCodes))
    .required(),
  status: yup.string<'error'>().equals(['error']).required(),
});

const testTokens = {
  optimism: {
    // USDC: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
  },
  worldchain: {
    USDC: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
  },
};

const mainContract =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
    ? '0x9Cf4F011F55Add3ECC1B1B497A3e9bd32183D6e8' // same contract for now since I didn't add proofs
    : '0x9Cf4F011F55Add3ECC1B1B497A3e9bd32183D6e8';

/* Asynchronous Implementation
For the purpose of variability some of these commands use async handlers
and some of the commands user synchronous responses. 
*/

export const SendTransaction = () => {
  const [transactionData, setTransactionData] = useState<Record<
    string,
    any
  > | null>(null);
  const [receivedSendTransactionPayload, setReceivedSendTransactionPayload] =
    useState<Record<string, any> | null>(null);
  const [
    sendTransactionPayloadValidationMessage,
    setSendTransactionPayloadValidationMessage,
  ] = useState<string | null>();

  const [transactionId, setTransactionId] = useState<string>('');

  const client = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error,
    isError,
  } = useWaitForTransactionReceipt({
    client: client,
    appConfig: {
      app_id: process.env.NEXT_PUBLIC_STAGING_VERIFY_APP_ID || '',
    },
    transactionId: transactionId,
    pollingInterval: 2000,
  });

  const parseResponse = async (payload: MiniAppSendTransactionPayload) => {
    console.log('MiniAppSendTransaction, SUBSCRIBE PAYLOAD', payload);

    if (payload.status === 'error') {
      const errorMessage = await validateSchema(
        sendTransactionErrorPayloadSchema,
        payload,
      );

      if (!errorMessage) {
        setSendTransactionPayloadValidationMessage('Payload is valid');
      } else {
        setSendTransactionPayloadValidationMessage(errorMessage);
      }
    } else {
      const errorMessage = await validateSchema(
        sendTransactionSuccessPayloadSchema,
        payload,
      );

      if (!errorMessage) {
        setSendTransactionPayloadValidationMessage('Payload is valid');
      } else {
        setSendTransactionPayloadValidationMessage(errorMessage);
      }

      // const responseJson = await response.json();

      // setSendTransactionVerificationMessage(
      //   responseJson.isValid
      //     ? "Valid! Successful Transaction"
      //     : `Failed: ${responseJson.message}`
      // );
      setTransactionId(payload.transaction_id);
    }

    setReceivedSendTransactionPayload(payload);
  };

  const onSendTransactionClick = async () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000,
    ).toString();

    // transfers can also be at most 1 hour in the future.
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDC,
        amount: '100000',
      },
      nonce: Date.now().toString(),
      deadline,
    };

    const permitTransferArgsForm = [
      [permitTransfer.permitted.token, permitTransfer.permitted.amount],
      permitTransfer.nonce,
      permitTransfer.deadline,
    ];

    const transferDetails = {
      to: '0x126f7998Eb44Dd2d097A8AB2eBcb28dEA1646AC8',
      requestedAmount: '100000',
    };

    const transferDetailsArgsForm = [
      transferDetails.to,
      transferDetails.requestedAmount,
    ];

    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: '0x78c9b378b47c1700838c599e42edd4ffd1865ccd',
            abi: DEXABI,
            functionName: 'signatureTransfer',
            args: [
              permitTransferArgsForm,
              transferDetailsArgsForm,
              'PERMIT2_SIGNATURE_PLACEHOLDER_0',
            ],
          },
        ],
        permit2: [
          {
            ...permitTransfer,
            spender: '0x78c9b378b47c1700838c599e42edd4ffd1865ccd',
          },
        ],
      });
    setTransactionData(commandPayload);
    await parseResponse(finalPayload);
  };

  const onSendNestedTransactionClick = async () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000,
    ).toString();

    // transfers can also be at most 1 hour in the future.
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDC,
        amount: '10000',
      },
      nonce: Date.now().toString(),
      deadline,
    };
    const permitTransferArgsForm = [
      [permitTransfer.permitted.token, permitTransfer.permitted.amount],
      permitTransfer.nonce,
      permitTransfer.deadline,
    ];

    const permitTransfer2 = {
      permitted: {
        token: testTokens.worldchain.USDC,
        amount: '20000',
      },
      nonce: deadline,
      deadline,
    };

    const permitTransferArgsForm2 = [
      [permitTransfer2.permitted.token, permitTransfer2.permitted.amount],
      permitTransfer2.nonce,
      permitTransfer2.deadline,
    ];

    const transferDetails = {
      to: '0x126f7998Eb44Dd2d097A8AB2eBcb28dEA1646AC8',
      requestedAmount: '10000',
    };

    const transferDetails2 = {
      to: '0x126f7998Eb44Dd2d097A8AB2eBcb28dEA1646AC8',
      requestedAmount: '20000',
    };

    const transferDetailsArgsForm = [
      transferDetails.to,
      transferDetails.requestedAmount,
    ];

    const transferDetailsArgsForm2 = [
      transferDetails2.to,
      transferDetails2.requestedAmount,
    ];

    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: '0x78c9b378b47c1700838c599e42edd4ffd1865ccd',
            abi: DEXABI,
            functionName: 'signatureTransfer',
            args: [
              permitTransferArgsForm,
              transferDetailsArgsForm,
              'PERMIT2_SIGNATURE_PLACEHOLDER_0',
            ],
          },
          {
            address: '0x78c9b378b47c1700838c599e42edd4ffd1865ccd',
            abi: DEXABI,
            functionName: 'signatureTransfer',
            args: [
              permitTransferArgsForm2,
              transferDetailsArgsForm2,
              'PERMIT2_SIGNATURE_PLACEHOLDER_1',
            ],
          },
        ],
        permit2: [
          {
            ...permitTransfer,
            spender: '0x78c9b378b47c1700838c599e42edd4ffd1865ccd',
          },
          {
            ...permitTransfer2,
            spender: '0x78c9b378b47c1700838c599e42edd4ffd1865ccd',
          },
        ],
      });
    setTransactionData(commandPayload);
    await parseResponse(finalPayload);
  };

  const testNFTPurchase = async () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000,
    ).toString();

    // transfers can also be at most 1 hour in the future.
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDC,
        amount: '1000000',
      },
      nonce: Date.now().toString(),
      deadline,
    };
    const permitTransferArgsForm = [
      [permitTransfer.permitted.token, permitTransfer.permitted.amount],
      permitTransfer.nonce,
      permitTransfer.deadline,
    ];

    const transferDetails = {
      to: '0x640487Ce2c45bD05D03b65783c15aa1ac694cDb6',
      requestedAmount: '1000000',
    };

    const transferDetailsArgsForm = [
      transferDetails.to,
      transferDetails.requestedAmount,
    ];

    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: '0x640487Ce2c45bD05D03b65783c15aa1ac694cDb6',
            abi: ANDYABI,
            functionName: 'buyNFTWithPermit2',
            args: [
              permitTransferArgsForm,
              transferDetailsArgsForm,
              'PERMIT2_SIGNATURE_PLACEHOLDER_0',
            ],
          },
        ],
        permit2: [
          {
            ...permitTransfer,
            spender: '0x640487Ce2c45bD05D03b65783c15aa1ac694cDb6',
          },
        ],
      });
    setTransactionData(commandPayload);
    await parseResponse(finalPayload);
  };

  const doubleAction = async () => {
    await MiniKit.commandsAsync.verify({
      action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION || '',
      signal: '123',
      verification_level: VerificationLevel.Device,
    });

    await MiniKit.commandsAsync.pay({
      to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(0.1, Tokens.WLD).toString(),
        },
      ],
      description: 'Test Chaining',
      reference: new Date().toISOString(),
    });
  };

  const doubleActionTransact = async () => {
    await MiniKit.commandsAsync.verify({
      action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION || '',
      signal: '123',
      verification_level: VerificationLevel.Device,
    });

    await onSendTransactionClick();
  };

  const mintToken = async () => {
    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: mainContract,
            abi: MinikitStaging,
            functionName: 'mintToken',
            args: [],
          },
        ],
      });
    setTransactionData(commandPayload);
    await parseResponse(finalPayload);
  };

  const bumpFunctionCalls = async () => {
    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: mainContract,
            abi: MinikitStaging,
            functionName: 'trackCalls',
            args: [],
          },
        ],
      });
    setTransactionData(commandPayload);
    await parseResponse(finalPayload);
  };

  const getTotalTokensMinted = async () => {
    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: mainContract,
            abi: MinikitStaging,
            functionName: 'getTotalTokensMinted',
            args: [],
          },
        ],
      });
    setTransactionData(commandPayload);
    await parseResponse(finalPayload);
  };

  const intentionallyRevert = async () => {
    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: mainContract,
            abi: MinikitStaging,
            functionName: 'intentionalRevert',
            args: [],
          },
        ],
      });
    setTransactionData(commandPayload);
    await parseResponse(finalPayload);
  };

  const nonExistantFunction = async () => {
    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: mainContract,
            abi: MinikitStaging,
            functionName: 'functionDoesNotExist',
            args: [],
          },
        ],
      });
    setTransactionData(commandPayload);
    await parseResponse(finalPayload);
  };

  const testEthTransaction = async () => {
    const { commandPayload, finalPayload } =
      await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: '0x2E7BeBAB990076A10fBb5e8C2Ff16Fc1434387ad',
            abi: ForwardABI,
            functionName: 'pay',
            args: ['0x377da9cab87c04a1d6f19d8b4be9aef8df26fcdd'], // Andy
            value: '0x9184E72A000', // Send 0.00001 ETH
          },
        ],
      });
    setTransactionData(commandPayload);
    await parseResponse(finalPayload);
  };

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Send Transaction</h2>
      <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Note:</span> Green buttons should
              always work, red should fail, and black works if the conditions
              are met.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-y-1">
        <p>Raw string:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces max-h-[300px] overflow-y-scroll">
            {transactionData
              ? JSON.stringify(transactionData, null, 3)
              : JSON.stringify(null)}
          </pre>
        </div>
      </div>
      <div className="grid gap-x-2 grid-cols-2">
        <button
          className="bg-green-500 text-white rounded-lg p-4 w-full"
          onClick={mintToken}
        >
          Mint Token
        </button>
        <button
          className="bg-green-500 text-white rounded-lg p-4 w-full"
          onClick={bumpFunctionCalls}
        >
          No Response
        </button>
      </div>
      <div className="grid gap-x-2 grid-cols-2">
        <button
          className="bg-green-500 text-white rounded-lg p-4 w-full"
          onClick={getTotalTokensMinted}
        >
          No preview just response
        </button>
      </div>
      <div className="grid gap-x-2 grid-cols-2">
        <button
          className="bg-red-700 text-white rounded-lg p-4 w-full"
          onClick={nonExistantFunction}
        >
          Non Existant Function
        </button>
        <button
          className="bg-red-700 text-white rounded-lg p-4 w-full"
          onClick={intentionallyRevert}
        >
          Intentionally Revert
        </button>
      </div>
      <div className="grid gap-x-2 grid-cols-2">
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onSendTransactionClick}
        >
          Permit 2 Testing (0.1 USDC)
        </button>

        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onSendNestedTransactionClick}
        >
          Nested Transaction (0.3 USDC)
        </button>
      </div>

      <div className="grid gap-x-2 grid-cols-2">
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={doubleAction}
        >
          Test Chaining Pay
        </button>
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={doubleActionTransact}
        >
          Test Chaining Transact
        </button>
      </div>

      <div className="grid gap-x-2 grid-cols-2">
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={testEthTransaction}
        >
          Test ETH
        </button>
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={testNFTPurchase}
        >
          Purchase NFT Permit2 (0.1 USDC)
        </button>
      </div>

      <div className="grid gap-y-1">
        <p>
          Received from &quot;{ResponseEvent.MiniAppSendTransaction}&quot;:{' '}
        </p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(receivedSendTransactionPayload, null, 2)}
          </pre>
        </div>

        <div className="grid gap-y-1">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {sendTransactionPayloadValidationMessage ?? 'No validation'}
          </p>
        </div>

        <div className="grid gap-y-1">
          <p>Verification:</p>
          {/* {sendTransactionVerificationMessage ?? "No verification yet"} */}
          <div className="grid gap-y-1 bg-gray-300 p-2">
            {transactionId && <p>Transaction ID: {transactionId}</p>}
            {isConfirming && <p>Waiting for confirmation...</p>}
            {isConfirmed && <p>Transaction confirmed.</p>}
            {isError && <p>{error?.message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
