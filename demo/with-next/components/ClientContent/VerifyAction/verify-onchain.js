'use client';
import { IDKit, orbLegacy } from '@worldcoin/idkit';
import { MiniKit } from '@worldcoin/minikit-js';
import { useState } from 'react';
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from 'react/jsx-runtime';
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
  '0x02ce0121bfc7f4d142d2da0452344923e59e53da';
/**
 * Calls the TestVerify contract's verify function
 */
export const verifyOnchain = async (payload) => {
  const signal = payload.signal;
  try {
    const root = BigInt(payload.root);
    const nullifierHash = BigInt(payload.nullifierHash);
    const proof = decodeAbiParameters(
      parseAbiParameters('uint256[8]'),
      payload.proof,
    )[0];
    console.log('Sending transaction to verify proof on-chain:');
    console.log('Signal:', signal);
    console.log('Root:', root);
    console.log('NullifierHash:', nullifierHash);
    console.log('Proof:', proof);
    const result = await MiniKit.sendTransaction({
      transaction: [
        {
          address: TEST_VERIFY_CONTRACT_ADDRESS,
          abi: testVerifyAbi,
          functionName: 'verify',
          args: [signal, root, nullifierHash, proof],
        },
      ],
    });
    return {
      success: true,
      transactionHash: result.data.transactionId,
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
  const [onchainVerifyResult, setOnchainVerifyResult] = useState({});
  const handleOnchainVerify = async () => {
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
    // Fetch RP signature for IDKit
    const rpRes = await fetch('/api/rp-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'onchain-verify-test' }),
    });
    const rpSig = await rpRes.json();
    const rpContext = {
      rp_id: rpSig.rp_id,
      nonce: rpSig.nonce,
      created_at: rpSig.created_at,
      expires_at: rpSig.expires_at,
      signature: rpSig.sig,
    };
    const request = await IDKit.request({
      app_id: process.env.NEXT_PUBLIC_PROD_VERIFY_APP_ID,
      action: 'onchain-verify-test',
      rp_context: rpContext,
      allow_legacy_proofs: true,
    }).preset(orbLegacy({ signal }));
    const completion = await request.pollUntilCompletion();
    if (!completion.success) {
      setOnchainVerifyResult({
        success: false,
        error: `Verification failed: ${completion.error}`,
        isLoading: false,
      });
      return;
    }
    const firstResponse = completion.result.responses?.[0];
    if (firstResponse?.proof) {
      const merkleRoot = firstResponse.merkle_root;
      const nullifierHash = firstResponse.nullifier_hash;
      const proof = firstResponse.proof;
      try {
        const result = await verifyOnchain({
          signal,
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
    return _jsx(_Fragment, {});
  }
  return _jsxs('div', {
    className: 'grid gap-y-2 mt-6 border-t pt-4',
    children: [
      _jsx('h3', {
        className: 'font-bold text-xl',
        children: 'Onchain Verification Test',
      }),
      _jsxs('p', {
        className: 'text-sm text-gray-600',
        children: [
          'Tests the verification proof on-chain using the TestVerify contract at address: ',
          TEST_VERIFY_CONTRACT_ADDRESS,
          _jsx('br', {}),
          'This will only work on the prod QA App -',
          _jsx('a', {
            href: 'https://world.org/ecosystem/app_dfbe55706a640c82dce839bb0ecae74d',
            target: '_blank',
            rel: 'noopener noreferrer',
            children: 'app_dfbe55706a640c82dce839bb0ecae74d',
          }),
          _jsx('br', {}),
        ],
      }),
      _jsx('button', {
        className:
          'bg-black text-white rounded-lg p-4 w-full disabled:opacity-20',
        onClick: handleOnchainVerify,
        children: onchainVerifyResult.isLoading
          ? 'Verifying on-chain...'
          : 'Verify on-chain with TestVerify contract',
      }),
      onchainVerifyResult.success !== undefined &&
        _jsx('div', {
          className: `p-3 rounded ${onchainVerifyResult.success ? 'bg-green-100' : 'bg-red-100'}`,
          children: onchainVerifyResult.success
            ? _jsxs('div', {
                children: [
                  _jsx('p', {
                    className: 'font-bold text-green-800',
                    children: 'Verification successful!',
                  }),
                  _jsxs('p', {
                    className: 'text-sm text-green-700',
                    children: [
                      'Transaction hash: ',
                      onchainVerifyResult.transactionHash,
                    ],
                  }),
                ],
              })
            : _jsxs('div', {
                children: [
                  _jsx('p', {
                    className: 'font-bold text-red-800',
                    children: 'Verification failed',
                  }),
                  _jsx('p', {
                    className: 'text-sm text-red-700',
                    children: onchainVerifyResult.error,
                  }),
                ],
              }),
        }),
    ],
  });
};
