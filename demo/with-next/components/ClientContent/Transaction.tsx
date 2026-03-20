'use client';
import { getWorldAppProvider, MiniKit } from '@worldcoin/minikit-js';
import type {
  MiniKitSendTransactionOptions,
  SendTransactionResult,
} from '@worldcoin/minikit-js/commands';
import { useWaitForUserOperationReceipt } from '@worldcoin/minikit-react';
import { useState } from 'react';
import { createPublicClient, encodeFunctionData, http } from 'viem';
import { worldchain } from 'viem/chains';
import {
  useConfig,
  useWaitForTransactionReceipt as useWagmiWaitForTransactionReceipt,
} from 'wagmi';
import * as yup from 'yup';
import ForwardABI from '../../abi/Forward.json';
import MinikitStaging from '../../abi/MinikitStaging.json';
import { validateSchema } from './helpers/validate-schema';
import {
  DemoExecutionMode,
  wagmiNativeSendTransaction,
} from './helpers/wagmi-native';

const sendTransactionResultSchema = yup.object({
  userOpHash: yup.string().required(),
  status: yup.string<'success'>().oneOf(['success']).required(),
  version: yup.number().required(),
  from: yup.string().required(),
  timestamp: yup.string().required(),
});

const mainContract =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
    ? '0x9Cf4F011F55Add3ECC1B1B497A3e9bd32183D6e8' // same contract for now since I didn't add proofs
    : '0x9Cf4F011F55Add3ECC1B1B497A3e9bd32183D6e8';

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const PERMIT_BURN_CONTRACT_ADDRESS =
  '0x378543ea0A7b6B048d441cAC1885e3a6b76aD17D';
const MKT_TOKEN_ADDRESS = '0x9Cf4F011F55Add3ECC1B1B497A3e9bd32183D6e8';
const UINT160_MAX = (1n << 160n) - 1n;
const UINT256_MAX = (1n << 256n) - 1n;

const PERMIT2_ALLOWANCE_TRANSFER_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
    ],
    outputs: [],
  },
] as const;

const PERMIT_BURN_ABI = [
  {
    type: 'function',
    name: 'burn',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [],
  },
] as const;

const ERC20_DECIMALS_ABI = [
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export const SendTransaction = () => {
  const wagmiConfig = useConfig();
  const [executionMode, setExecutionMode] =
    useState<DemoExecutionMode>('minikit');
  const isWagmiMode = executionMode === 'wagmi';
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
  const [transactionHash, setTransactionHash] = useState<
    `0x${string}` | undefined
  >();
  const [providerHashProbePayload, setProviderHashProbePayload] =
    useState<Record<string, any> | null>(null);
  const [providerHashProbeResult, setProviderHashProbeResult] = useState<Record<
    string,
    any
  > | null>(null);
  const [providerHashProbeHash, setProviderHashProbeHash] =
    useState<string>('');
  const [providerHashProbeReceiptMessage, setProviderHashProbeReceiptMessage] =
    useState<string>('Run the probe to compare the returned hash.');
  const [verificationMode, setVerificationMode] = useState<
    'minikit' | 'wagmi' | null
  >(null);

  const client = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
  });

  const {
    isLoading: isMiniKitConfirming,
    isSuccess: isMiniKitConfirmed,
    error: miniKitError,
    isError: isMiniKitError,
  } = useWaitForUserOperationReceipt({
    client: client,
    userOpHash: transactionId,
  });

  const {
    isLoading: isWagmiConfirming,
    isSuccess: isWagmiConfirmed,
    error: wagmiError,
    isError: isWagmiError,
  } = useWagmiWaitForTransactionReceipt({
    chainId: 480,
    hash: transactionHash,
    query: {
      enabled: Boolean(transactionHash),
    },
  });

  const {
    isLoading: isProviderProbeUserOpConfirming,
    isSuccess: isProviderProbeUserOpConfirmed,
    error: providerProbeUserOpError,
    isError: isProviderProbeUserOpError,
  } = useWaitForUserOperationReceipt({
    client: client,
    userOpHash: providerHashProbeHash,
  });

  const handleResult = async (result: {
    data: SendTransactionResult;
    executedWith: string;
  }) => {
    console.log('SendTransaction result', result);

    const errorMessage = await validateSchema(
      sendTransactionResultSchema,
      result.data,
    );

    if (!errorMessage) {
      setSendTransactionPayloadValidationMessage('Payload is valid');
    } else {
      setSendTransactionPayloadValidationMessage(errorMessage);
    }

    if (result.executedWith === 'minikit' && result.data.userOpHash) {
      setVerificationMode('minikit');
      setTransactionId(result.data.userOpHash);
    } else if (result.executedWith === 'wagmi') {
      setVerificationMode('wagmi');
      const hash = result.data.userOpHash;

      if (hash) {
        setTransactionHash(hash as `0x${string}`);
      }
    } else {
      setVerificationMode(null);
    }

    setReceivedSendTransactionPayload({
      executedWith: result.executedWith,
      data: result.data,
    });
  };

  const handleError = (err: unknown) => {
    console.error('SendTransaction error', err);
    const errorData = {
      error: err instanceof Error ? err.message : String(err),
      code: (err as any)?.code,
      details: (err as any)?.details,
    };
    setSendTransactionPayloadValidationMessage(`Error: ${errorData.error}`);
    setVerificationMode(null);
    setReceivedSendTransactionPayload(errorData);
  };

  const miniKitErrorMessage =
    typeof miniKitError === 'string'
      ? miniKitError
      : miniKitError
        ? String(miniKitError)
        : undefined;

  const executeTransaction = async (
    txOptions: MiniKitSendTransactionOptions,
  ) => {
    setTransactionData(txOptions);
    setTransactionId('');
    setTransactionHash(undefined);
    setVerificationMode(null);

    try {
      const result =
        executionMode === 'wagmi'
          ? await wagmiNativeSendTransaction(wagmiConfig, txOptions)
          : await MiniKit.sendTransaction(txOptions);
      await handleResult(result);
    } catch (err) {
      handleError(err);
    }
  };

  const resolveOwnerAddress = async (): Promise<`0x${string}`> => {
    const existing = MiniKit.user?.walletAddress;
    if (existing && existing.startsWith('0x')) {
      return existing as `0x${string}`;
    }

    const authResult = await MiniKit.walletAuth({
      nonce: crypto.randomUUID().replace(/-/g, ''),
      statement: 'Authenticate to continue with Permit2 test.',
    });

    const address = authResult.data.address;
    if (!address || !address.startsWith('0x')) {
      throw new Error('Failed to resolve wallet address from walletAuth.');
    }
    return address as `0x${string}`;
  };

  const resolveOneTokenAmount = async (): Promise<bigint> => {
    const decimalsRaw = await client.readContract({
      address: MKT_TOKEN_ADDRESS as `0x${string}`,
      abi: ERC20_DECIMALS_ABI,
      functionName: 'decimals',
    });

    const decimals = Number(decimalsRaw);
    if (!Number.isInteger(decimals) || decimals < 0) {
      throw new Error('Token decimals returned an invalid value.');
    }

    const amount = 10n ** BigInt(decimals);
    if (amount > UINT160_MAX) {
      throw new Error('Computed amount exceeds uint160 max.');
    }
    return amount;
  };

  const testPermitApprove = async () => {
    const owner = await resolveOwnerAddress();
    const amount = await resolveOneTokenAmount();

    const tokenApproveTxOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: MKT_TOKEN_ADDRESS,
          data: encodeFunctionData({
            abi: ERC20_APPROVE_ABI,
            functionName: 'approve',
            args: [PERMIT2_ADDRESS as `0x${string}`, UINT256_MAX],
          }),
        },
      ],
    };

    const approveTxOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: PERMIT2_ADDRESS,
          data: encodeFunctionData({
            abi: PERMIT2_ALLOWANCE_TRANSFER_ABI,
            functionName: 'approve',
            args: [
              MKT_TOKEN_ADDRESS as `0x${string}`,
              PERMIT_BURN_CONTRACT_ADDRESS as `0x${string}`,
              amount, // Approve 5 tokens to be safe
              Math.floor(Date.now() / 1000) + 3600,
            ],
          }),
        },
      ],
    };

    const burnTxOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: PERMIT_BURN_CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: PERMIT_BURN_ABI,
            functionName: 'burn',
            args: [owner],
          }),
        },
      ],
    };

    if (executionMode === 'wagmi') {
      await executeTransaction(tokenApproveTxOptions);
      await executeTransaction(approveTxOptions);
      await executeTransaction(burnTxOptions);
      return;
    }

    await executeTransaction({
      chainId: 480,
      transactions: [
        ...tokenApproveTxOptions.transactions,
        ...approveTxOptions.transactions,
        ...burnTxOptions.transactions,
      ],
    });
  };

  const mintToken = async () => {
    const txOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: mainContract,
          data: encodeFunctionData({
            abi: MinikitStaging as any,
            functionName: 'mintToken',
            args: [],
          }),
        },
      ],
    };
    await executeTransaction(txOptions);
  };

  const mintTokenWithRawData = async () => {
    const data = encodeFunctionData({
      abi: MinikitStaging as any,
      functionName: 'mintToken',
      args: [],
    });

    const txOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: mainContract,
          data,
        },
      ],
    };
    await executeTransaction(txOptions);
  };

  const bumpFunctionCalls = async () => {
    const txOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: mainContract,
          data: encodeFunctionData({
            abi: MinikitStaging as any,
            functionName: 'trackCalls',
            args: [],
          }),
        },
      ],
    };
    await executeTransaction(txOptions);
  };

  const getTotalTokensMinted = async () => {
    const txOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: mainContract,
          data: encodeFunctionData({
            abi: MinikitStaging as any,
            functionName: 'getTotalTokensMinted',
            args: [],
          }),
        },
      ],
    };
    await executeTransaction(txOptions);
  };

  const intentionallyRevert = async () => {
    const txOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: mainContract,
          data: encodeFunctionData({
            abi: MinikitStaging as any,
            functionName: 'intentionalRevert',
            args: [],
          }),
        },
      ],
    };
    await executeTransaction(txOptions);
  };

  const nonExistantFunction = async () => {
    const txOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: mainContract,
          data: '0xdeadbeef',
        },
      ],
    };
    await executeTransaction(txOptions);
  };

  const testEthTransaction = async () => {
    const txOptions: MiniKitSendTransactionOptions = {
      chainId: 480,
      transactions: [
        {
          to: '0x2E7BeBAB990076A10fBb5e8C2Ff16Fc1434387ad',
          data: encodeFunctionData({
            abi: ForwardABI as any,
            functionName: 'pay',
            args: ['0x377da9cab87c04a1d6f19d8b4be9aef8df26fcdd'],
          }),
          value: '0x9184E72A000', // Send 0.00001 ETH
        },
      ],
    };
    await executeTransaction(txOptions);
  };

  const testProviderHashMismatch = async () => {
    const provider = getWorldAppProvider();
    const rpcTransaction = {
      to: mainContract,
      data: encodeFunctionData({
        abi: MinikitStaging as any,
        functionName: 'trackCalls',
        args: [],
      }),
      chainId: '0x1e0',
    };

    setProviderHashProbeHash('');
    setProviderHashProbePayload({
      method: 'eth_sendTransaction',
      params: [rpcTransaction],
    });
    setProviderHashProbeResult(null);
    setProviderHashProbeReceiptMessage('Requesting account access...');

    try {
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const from = accounts[0];
      if (!from) {
        throw new Error('eth_requestAccounts returned no account.');
      }

      const params = [{ from, ...rpcTransaction }];
      setProviderHashProbePayload({
        method: 'eth_sendTransaction',
        params,
      });
      setProviderHashProbeReceiptMessage(
        'Waiting for a transaction receipt on the returned hash...',
      );

      const returnedHash = (await provider.request({
        method: 'eth_sendTransaction',
        params,
      })) as `0x${string}`;

      setProviderHashProbeHash(returnedHash);
      setProviderHashProbeResult({
        account: from,
        returnedHash,
      });

      try {
        const receipt = await client.waitForTransactionReceipt({
          hash: returnedHash,
          pollingInterval: 1_000,
          timeout: 15_000,
        });

        setProviderHashProbeReceiptMessage(
          `Transaction receipt lookup succeeded for ${receipt.transactionHash}.`,
        );
        setProviderHashProbeResult((current) => ({
          ...(current ?? {}),
          receipt,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setProviderHashProbeReceiptMessage(
          `Transaction receipt lookup failed on the returned hash: ${message}`,
        );
        setProviderHashProbeResult((current) => ({
          ...(current ?? {}),
          txReceiptLookupError: message,
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setProviderHashProbeReceiptMessage(`Provider probe failed: ${message}`);
      setProviderHashProbeResult({
        error: message,
      });
    }
  };

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Send Transaction</h2>
      <div className="grid grid-cols-2 gap-2">
        <button
          className={`rounded-lg p-3 w-full ${
            executionMode === 'minikit'
              ? 'bg-black text-white'
              : 'bg-gray-200 text-black'
          }`}
          onClick={() => setExecutionMode('minikit')}
        >
          MiniKit Command
        </button>
        <button
          className={`rounded-lg p-3 w-full ${
            executionMode === 'wagmi'
              ? 'bg-black text-white'
              : 'bg-gray-200 text-black'
          }`}
          onClick={() => setExecutionMode('wagmi')}
        >
          Wagmi Native (Single Tx)
        </button>
      </div>
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
              <span className="font-medium">Note:</span> MiniKit mode can send
              bundled transactions. Wagmi Native mode in this demo is limited to
              single-transaction calls and is intended to exercise the wagmi
              connector/provider path. The provider probe below uses the raw
              EIP-1193 provider and compares the returned hash against both a
              user-op receipt poll and a transaction receipt poll.
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
          className="bg-blue-600 text-white rounded-lg p-4 w-full disabled:opacity-50"
          onClick={mintTokenWithRawData}
          disabled={!isWagmiMode}
        >
          Wagmi Single Tx (To+Data)
        </button>
      </div>
      <div className="grid gap-x-2 grid-cols-2">
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
      <div className="grid gap-x-2 grid-cols-1">
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={testEthTransaction}
        >
          Test ETH
        </button>
      </div>

      <div className="grid gap-x-2 grid-cols-1">
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={testPermitApprove}
        >
          Test Permit Approve
        </button>
      </div>

      <div className="grid gap-y-2 border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold">Provider hash repro</h3>
        <p className="text-sm text-gray-700">
          This sends a raw `eth_sendTransaction` through
          `getWorldAppProvider()`, then waits for a transaction receipt using
          the returned hash. On the current bug, the same hash should confirm as
          a user operation but fail as a transaction receipt lookup.
        </p>
        <button
          className="bg-indigo-700 text-white rounded-lg p-4 w-full disabled:opacity-50"
          onClick={testProviderHashMismatch}
          disabled={!MiniKit.isInWorldApp()}
        >
          Test provider returned hash
        </button>
        <div className="grid gap-y-1">
          <p>Provider RPC payload:</p>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(providerHashProbePayload, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid gap-y-1">
          <p>Provider probe result:</p>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(providerHashProbeResult, null, 2)}
            </pre>
          </div>
        </div>
        <div className="grid gap-y-1">
          <p>Provider probe verification:</p>
          <div className="grid gap-y-1 bg-gray-300 p-2">
            {providerHashProbeHash && (
              <p>Returned hash: {providerHashProbeHash}</p>
            )}
            <p>{providerHashProbeReceiptMessage}</p>
            {providerHashProbeHash && isProviderProbeUserOpConfirming && (
              <p>Waiting for user operation confirmation on the same hash...</p>
            )}
            {providerHashProbeHash && isProviderProbeUserOpConfirmed && (
              <p>User operation confirmation succeeded on the same hash.</p>
            )}
            {providerHashProbeHash && providerProbeUserOpError && (
              <p>{String(providerProbeUserOpError)}</p>
            )}
            {providerHashProbeHash &&
              providerHashProbeReceiptMessage.includes('failed') &&
              !isProviderProbeUserOpError &&
              !isProviderProbeUserOpConfirming &&
              isProviderProbeUserOpConfirmed && (
                <p>
                  This mismatch means the provider returned a user operation
                  hash, not a transaction hash.
                </p>
              )}
          </div>
        </div>
      </div>

      <div className="grid gap-y-1">
        <p>Result from send transaction execution:</p>
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
          <div className="grid gap-y-1 bg-gray-300 p-2">
            {verificationMode === 'minikit' && (
              <>
                {transactionId && <p>UserOp hash: {transactionId}</p>}
                {isMiniKitConfirming && <p>Waiting for confirmation...</p>}
                {isMiniKitConfirmed && <p>Transaction confirmed.</p>}
                {isMiniKitError && miniKitErrorMessage && (
                  <p>{miniKitErrorMessage}</p>
                )}
              </>
            )}
            {verificationMode === 'wagmi' && (
              <>
                {transactionHash && <p>Transaction hash: {transactionHash}</p>}
                {isWagmiConfirming && <p>Waiting for confirmation...</p>}
                {isWagmiConfirmed && <p>Transaction confirmed.</p>}
                {isWagmiError && <p>{wagmiError?.message}</p>}
              </>
            )}
            {!verificationMode && <p>No verification in this mode.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
