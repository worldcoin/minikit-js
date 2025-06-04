'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { useState } from 'react';
import { decodeAbiParameters, parseAbiParameters } from 'viem';

// ABI fragment for the verify function
const testVerifyAbi = [
  {
    inputs: [
      { name: 'signal', type: 'address' },
      { name: 'root', type: 'uint256' },
      { name: 'nullifierHash', type: 'uint256' },
      { name: 'proof', type: 'uint256[8]' },
    ],
    name: 'verify',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/** works on Prod QA App, app_id: app_dfbe55706a640c82dce839bb0ecae74d */
export const TEST_VERIFY_CONTRACT_ADDRESS =
  '0x793dda8ec2aff37945627ab64dd4e8b4e8ea4cb1';

/**
 * Calls the TestVerify contract's verify function
 */
export const verifyOnchain = async (payload: {
  signal: string;
  root: string;
  nullifierHash: string;
  proof: string;
}): Promise<{
  success: boolean;
  transactionHash?: string;
  error?: string;
}> => {
  const signal = payload.signal;

  try {
    const root = BigInt(payload.root);
    const nullifierHash = BigInt(payload.nullifierHash);
    const proof = decodeAbiParameters(
      parseAbiParameters('uint256[8]'),
      payload.proof as `0x${string}`,
    )[0];

    console.log('Sending transaction to verify proof on-chain:');
    console.log('Signal:', signal);
    console.log('Root:', root);
    console.log('NullifierHash:', nullifierHash);
    console.log('Proof:', proof);

    const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
      transaction: [
        {
          address: TEST_VERIFY_CONTRACT_ADDRESS,
          abi: testVerifyAbi,
          functionName: 'verify',
          args: [signal, root, nullifierHash, proof],
        },
      ],
    });

    if (finalPayload.status === 'success') {
      return {
        success: true,
        transactionHash: finalPayload.transaction_id,
      };
    } else {
      return {
        success: false,
        error: `Transaction failed: ${finalPayload.error_code || 'Unknown error'} \n ${JSON.stringify(finalPayload.details)}`,
      };
    }
  } catch (error) {
    console.error('Error verifying on-chain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const VerifyOnchainProof = () => {
  const [onchainVerifyResult, setOnchainVerifyResult] = useState<{
    success?: boolean;
    transactionHash?: string;
    error?: string;
    isLoading?: boolean;
  }>({});

  const handleOnchainVerify = async () => {
    let signal = MiniKit.user.walletAddress;
    if (!signal) {
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: 'i-trust-you',
      });
      if (finalPayload.status === 'success') {
        signal = finalPayload.address;
      } else {
        return { success: false, error: 'No wallet address' };
      }
    }
    const { finalPayload } = await MiniKit.commandsAsync.verify({
      action: 'onchain-verify-test',
      signal: signal,
    });
    if (finalPayload.status === 'success') {
      const merkleRoot = finalPayload.merkle_root;
      const nullifierHash = finalPayload.nullifier_hash;
      const proof = finalPayload.proof;

      try {
        // Using a fixed signal address for simplicity
        const result = await verifyOnchain({
          signal: signal,
          root: merkleRoot,
          nullifierHash: nullifierHash,
          proof: proof,
        });

        setOnchainVerifyResult({
          ...result,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error in onchain verification:', error);
        setOnchainVerifyResult({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false,
        });
      }
    }
  };
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging') {
    return <></>;
  }
  return (
    <div className="grid gap-y-2 mt-6 border-t pt-4">
      <h3 className="font-bold text-xl">Onchain Verification Test</h3>
      <p className="text-sm text-gray-600">
        Tests the verification proof on-chain using the TestVerify contract at
        address: {TEST_VERIFY_CONTRACT_ADDRESS}
        <br />
        This will only work on the prod QA App -
        <a
          href="https://world.org/ecosystem/app_dfbe55706a640c82dce839bb0ecae74d"
          target="_blank"
          rel="noopener noreferrer"
        >
          app_dfbe55706a640c82dce839bb0ecae74d
        </a>
        <br />
      </p>

      <button
        className={
          'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20'
        }
        onClick={handleOnchainVerify}
      >
        {onchainVerifyResult.isLoading
          ? 'Verifying on-chain...'
          : 'Verify on-chain with TestVerify contract'}
      </button>

      {onchainVerifyResult.success !== undefined && (
        <div
          className={`p-3 rounded ${onchainVerifyResult.success ? 'bg-green-100' : 'bg-red-100'}`}
        >
          {onchainVerifyResult.success ? (
            <div>
              <p className="font-bold text-green-800">
                Verification successful!
              </p>
              <p className="text-sm text-green-700">
                Transaction hash: {onchainVerifyResult.transactionHash}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-red-800">Verification failed</p>
              <p className="text-sm text-red-700">
                {onchainVerifyResult.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
