'use client';

import {
  IDKitRequestWidget,
  orbLegacy,
  type IDKitResult,
  type RpContext,
} from '@worldcoin/idkit';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMemo, useState } from 'react';
import {
  decodeAbiParameters,
  encodeFunctionData,
  parseAbiParameters,
} from 'viem';

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
  '0x02ce0121bfc7f4d142d2da0452344923e59e53da';

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

    const calldata = encodeFunctionData({
      abi: testVerifyAbi,
      functionName: 'verify',
      args: [signal, root, nullifierHash, proof],
    });

    const result = await MiniKit.sendTransaction({
      chainId: 480,
      transactions: [
        {
          to: TEST_VERIFY_CONTRACT_ADDRESS,
          data: calldata,
        },
      ],
    });

    return {
      success: true,
      transactionHash: result.data.userOpHash ?? undefined,
    };
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
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);
  const [widgetSignal, setWidgetSignal] = useState('');

  const preset = useMemo(
    () => orbLegacy({ signal: widgetSignal }),
    [widgetSignal],
  );

  const appId = process.env.NEXT_PUBLIC_PROD_VERIFY_APP_ID as `app_${string}`;
  const environment =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'production'
      ? 'production'
      : 'staging';

  const handleStartVerify = async () => {
    try {
      let signal = MiniKit.user.walletAddress;
      if (!signal) {
        const authResult = await MiniKit.walletAuth({
          nonce: 'itrustyou123',
        });
        signal = authResult.data.address;
      }
      if (!signal) {
        setOnchainVerifyResult({ success: false, error: 'No wallet address' });
        return;
      }

      const rpRes = await fetch('/api/rp-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'onchain-verify-test' }),
      });
      const rpSig = await rpRes.json();
      const rpCtx: RpContext = {
        rp_id: rpSig.rp_id,
        nonce: rpSig.nonce,
        created_at: rpSig.created_at,
        expires_at: rpSig.expires_at,
        signature: rpSig.sig,
      };

      setWidgetSignal(signal);
      setRpContext(rpCtx);
      setOnchainVerifyResult({ isLoading: true });
      setWidgetOpen(true);
    } catch (error) {
      console.error('Error starting on-chain verification:', error);
      setOnchainVerifyResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  };

  const handleVerifyResult = async (result: IDKitResult) => {
    const firstResponse = (result as any).responses?.[0] as
      | Record<string, any>
      | undefined;

    if (firstResponse?.proof) {
      try {
        const onchainResult = await verifyOnchain({
          signal: widgetSignal,
          root: firstResponse.merkle_root,
          nullifierHash: firstResponse.nullifier_hash,
          proof: firstResponse.proof,
        });
        setOnchainVerifyResult({ ...onchainResult, isLoading: false });
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
        onClick={handleStartVerify}
      >
        {onchainVerifyResult.isLoading
          ? 'Verifying on-chain...'
          : 'Verify on-chain with TestVerify contract'}
      </button>

      {rpContext && (
        <IDKitRequestWidget
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          app_id={appId}
          action="onchain-verify-test"
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={preset}
          onSuccess={() => {
            setOnchainVerifyResult((prev) => ({
              ...prev,
              isLoading: false,
            }));
          }}
          handleVerify={handleVerifyResult}
          onError={(errorCode) => {
            setOnchainVerifyResult({
              success: false,
              error: `Verification failed: ${errorCode}`,
              isLoading: false,
            });
          }}
          environment={environment}
        />
      )}

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
