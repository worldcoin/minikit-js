'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import { useAccount, useWriteContract } from 'wagmi';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForUserOperationReceipt } from '@worldcoin/minikit-react';
import { STAGING_CONTRACT } from '@/lib/constants';
import abi from '@/abi/MinikitStaging.json';

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(),
});

function useTransactionReceipt(hash: string, isWorldApp: boolean) {
  // World App path: poll userOp → tx hash via MiniKit API
  const userOp = useWaitForUserOperationReceipt({
    client: publicClient,
    userOpHash: isWorldApp ? hash : '',
  });

  // EOA path: wait for standard tx receipt directly
  const [eoaReceipt, setEoaReceipt] = useState<{
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    transactionHash?: string;
  }>({ isLoading: false, isSuccess: false, isError: false });

  const pollEoa = useCallback(async (txHash: string) => {
    setEoaReceipt({ isLoading: true, isSuccess: false, isError: false });
    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
      setEoaReceipt({
        isLoading: false,
        isSuccess: receipt.status === 'success',
        isError: receipt.status !== 'success',
        transactionHash: receipt.transactionHash,
      });
    } catch {
      setEoaReceipt({
        isLoading: false,
        isSuccess: false,
        isError: true,
      });
    }
  }, []);

  useEffect(() => {
    if (hash && !isWorldApp) {
      pollEoa(hash);
    }
  }, [hash, isWorldApp, pollEoa]);

  useEffect(() => {
    if (!hash) {
      setEoaReceipt({ isLoading: false, isSuccess: false, isError: false });
    }
  }, [hash]);

  if (isWorldApp) {
    return userOp;
  }
  return eoaReceipt;
}

export function SendTransaction() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [mintHash, setMintHash] = useState<string>('');
  const [trackHash, setTrackHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const isWorldApp = MiniKit.isInWorldApp();
  const activeHash = mintHash || trackHash;
  const {
    isLoading: receiptLoading,
    isSuccess: receiptSuccess,
    isError: receiptError,
    transactionHash,
  } = useTransactionReceipt(activeHash, isWorldApp);

  const handleMint = async () => {
    setError('');
    setMintHash('');
    setTrackHash('');
    try {
      const hash = await writeContractAsync({
        address: STAGING_CONTRACT,
        abi,
        functionName: 'mintToken',
      });
      setMintHash(hash);
    } catch (e: any) {
      setError(`Mint failed: ${e.message}`);
    }
  };

  const handleTrackCalls = async () => {
    setError('');
    setMintHash('');
    setTrackHash('');
    try {
      const hash = await writeContractAsync({
        address: STAGING_CONTRACT,
        abi,
        functionName: 'trackCalls',
      });
      setTrackHash(hash);
    } catch (e: any) {
      setError(`Track calls failed: ${e.message}`);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        <h2 className="font-semibold">3. Send Transaction (Mint Token)</h2>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded text-sm break-all">
            {error}
          </div>
        )}

        <button
          onClick={handleMint}
          disabled={!isConnected}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
        >
          Mint Token (writeContract)
        </button>
        {mintHash && (
          <p className="text-xs break-all bg-gray-50 p-2 rounded">
            {isWorldApp ? 'UserOp' : 'Tx'} Hash: {mintHash}
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        <h2 className="font-semibold">4. Send Transaction (Track Calls)</h2>
        <button
          onClick={handleTrackCalls}
          disabled={!isConnected}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
        >
          Track Calls (writeContract)
        </button>
        {trackHash && (
          <p className="text-xs break-all bg-gray-50 p-2 rounded">
            {isWorldApp ? 'UserOp' : 'Tx'} Hash: {trackHash}
          </p>
        )}
      </div>

      {activeHash && (
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <h2 className="font-semibold">Transaction Receipt</h2>
          {receiptLoading && (
            <p className="text-sm text-yellow-700">Waiting for receipt...</p>
          )}
          {receiptSuccess && (
            <p className="text-sm text-green-700 break-all">
              Confirmed! Tx hash: {transactionHash}
            </p>
          )}
          {receiptError && (
            <p className="text-sm text-red-700">Receipt polling failed</p>
          )}
        </div>
      )}
    </>
  );
}
