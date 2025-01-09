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
import { useEffect, useState } from 'react';
import {
  createPublicClient,
  decodeAbiParameters,
  http,
  parseAbiParameters,
} from 'viem';
import { worldchain } from 'viem/chains';
import * as yup from 'yup';
import ANDYABI from '../../abi/Andy.json';
import DEXABI from '../../abi/DEX.json';
import ORBABI from '../../abi/orb.json';
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
    USDC: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    USDCE: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
  },
  worldchain: {
    USDCE: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
  },
};

export const SendTransaction = () => {
  const [transactionData, setTransactionData] = useState<Record<
    string,
    any
  > | null>(null);
  const [receivedSendTransactionPayload, setReceivedSendTransactionPayload] =
    useState<Record<string, any> | null>(null);
  const [tempInstallFix, setTempInstallFix] = useState(0);
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

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppSendTransaction,
      async (payload: MiniAppSendTransactionPayload) => {
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
      },
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSendTransaction);
    };
  }, [tempInstallFix]);

  const onSendTransactionClick = () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000,
    ).toString();

    // transfers can also be at most 1 hour in the future.
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDCE,
        amount: '200000',
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
      requestedAmount: '200000',
    };

    const transferDetailsArgsForm = [
      transferDetails.to,
      transferDetails.requestedAmount,
    ];

    const payload = MiniKit.commands.sendTransaction({
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
    setTempInstallFix((prev) => prev + 1);
    setTransactionData(payload);
  };

  const onSendOrbTransactionClick = () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000,
    ).toString();

    const address = '0xf3f92a60e6004f3982f0fde0d43602fc0a30a0db';
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDCE,
        amount: '1000000',
      },
      nonce: Date.now().toString(),
      deadline,
    };

    console.log(
      decodeAbiParameters(
        parseAbiParameters('uint256[8]'),
        '0x0ee140e3516f1ca89a95ac6960af057157447001e0009196d9617e5794d1394d04713410762300e0c8e5238f5faa1adde5a07da079aa4a5b9bf3fdafe61374131149c5f57bb5c9209fc34f04bf558f929d271a7c9511c4a9207a5bdc851f000b1c16b42ec819f6dbc70d041ddf34aed6b7104750c59094edd9ae3f043ae9e3290e173a4f750b8de4498fccbf3e769a04e122f92f60c5ca5a156b6ca73d9cb1571148d2ffd954a3feedc9a398fa197e7a6a64a2ee712e2b5ac43892ea9ec816c6083d1aea790eefba30eff83ce233c6472ad4f48417bde2d2b38c1494de22efed1cec8897a4ef913334967ffbf94102d95b70ae6d6578c66fdbf64c55418b5ac3' as `0x${string}`,
      )[0],
    );

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

    const payload = MiniKit.commands.sendTransaction({
      transaction: [
        {
          address: '0xF3F92A60e6004f3982F0FdE0d43602fC0a30a0dB',
          abi: ORBABI,
          functionName: 'mint',
          args: [
            address,
            '0x7548694f0144d414a064e50b83655679567706d5570055a63058c2a3e77e763',
            '0x1a07348bdd01a39b3e4d6b0e50539b56639f1b173dfb1ec845251f319d33817a',
            decodeAbiParameters(
              parseAbiParameters('uint256[8]'),
              '0x0f5af932c5ba8960596f1b2f668742d3618092318353318ec5166fe9eaaf44381893a22e5ab311bd9853f4832eb76f6020519b6e13bfa2f3e097d37435261bca066bc6cea60df41dbd0a91f2c6758c95e29c5b430108f0bdacf73f2401f2cdd90bf5f5bfac2ca6eacf15a11c6d1a15aa3da5ebd920771739fd1afbbbc948b6f505408f2293b1a1d719a48d6606af0ab7cbe2d368f8a3b1a464725b5e680a94c204079b1b7ba5508e852b3c7575ac41decb06fe39e335255bd1a5f04268eb560b269b0ee009fac478068465a6c9cf68541317d15180a57c31323569ed83c634df1c880ae470127f807c1ff7a3dc5d815a55fd95a463bf03810c82594e7c6ee02d' as `0x${string}`,
            )[0].map(String),
          ],
        },
      ],
    });

    console.log(JSON.stringify(payload, null, 2));
  };

  const onSendNestedTransactionClick = () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000,
    ).toString();

    // transfers can also be at most 1 hour in the future.
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDCE,
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
        token: testTokens.worldchain.USDCE,
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

    const payload = MiniKit.commands.sendTransaction({
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
    setTempInstallFix((prev) => prev + 1);
    setTransactionData(payload);
  };

  const testNFTPurchase = () => {
    const deadline = Math.floor(
      (Date.now() + 30 * 60 * 1000) / 1000,
    ).toString();

    // transfers can also be at most 1 hour in the future.
    const permitTransfer = {
      permitted: {
        token: testTokens.worldchain.USDCE,
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

    const payload = MiniKit.commands.sendTransaction({
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
    setTempInstallFix((prev) => prev + 1);
    setTransactionData(payload);
  };

  const doubleAction = async () => {
    const payload = await MiniKit.commandsAsync.verify({
      action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION || '',
      signal: '123',
      verification_level: VerificationLevel.Device,
    });
    const pay = await MiniKit.commandsAsync.pay({
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
    // onSendTransactionClick();
  };

  const doubleActionTransact = async () => {
    const payload = await MiniKit.commandsAsync.verify({
      action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION || '',
      signal: '123',
      verification_level: VerificationLevel.Device,
    });

    onSendTransactionClick();
  };

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Transaction</h2>
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
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onSendTransactionClick}
        >
          Simulation Fails
        </button>

        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onSendNestedTransactionClick}
        >
          Send Nested Transaction
        </button>
      </div>
      <div className="grid gap-x-2 grid-cols-2">
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={testNFTPurchase}
        >
          Purchase NFT Permit2
        </button>
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onSendOrbTransactionClick}
        >
          Send Orb
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
          {transactionId && <p>Transaction ID: {transactionId}</p>}
          {isConfirming && <p>Waiting for confirmation...</p>}
          {isConfirmed && <p>Transaction confirmed.</p>}
          {isError && <p>{error?.message}</p>}
        </div>
      </div>
    </div>
  );
};
