'use client';

import { useCallback, useEffect, useState } from 'react';
import { encodeFunctionData } from 'viem';
import { createPublicClient, http } from 'viem';
import { worldchain } from 'viem/chains';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForUserOperationReceipt } from '@worldcoin/minikit-react';
import { getWalletClient } from '@/lib/client';
import { STAGING_CONTRACT } from '@/lib/constants';
import abi from '@/abi/MinikitStaging.json';

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(),
});

function buildSiweMessage(params: {
  domain: string;
  address: string;
  uri: string;
  nonce: string;
  issuedAt: string;
  chainId: number;
  statement?: string;
}): string {
  let msg = `${params.domain} wants you to sign in with your Ethereum account:\n`;
  msg += `${params.address}\n\n`;
  if (params.statement) {
    msg += `${params.statement}\n`;
  }
  msg += `\n`;
  msg += `URI: ${params.uri}\n`;
  msg += `Version: 1\n`;
  msg += `Chain ID: ${params.chainId}\n`;
  msg += `Nonce: ${params.nonce}\n`;
  msg += `Issued At: ${params.issuedAt}`;
  return msg;
}

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

  // Reset EOA state when hash clears
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

export default function ClientApp() {
  const [address, setAddress] = useState<string | null>(null);
  const [siweResult, setSiweResult] = useState<string>('');
  const [signResult, setSignResult] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [trackHash, setTrackHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const isWorldApp = MiniKit.isInWorldApp();
  const activeHash = txHash || trackHash;
  const {
    isLoading: receiptLoading,
    isSuccess: receiptSuccess,
    isError: receiptError,
    transactionHash,
  } = useTransactionReceipt(activeHash, isWorldApp);

  const handleConnect = async () => {
    setError('');
    try {
      const client = getWalletClient();
      const [addr] = (await client.request({
        method: 'eth_requestAccounts',
        params: undefined,
      })) as string[];
      setAddress(addr);
    } catch (e: any) {
      setError(`Connect failed: ${e.message}`);
    }
  };

  const handleSiwe = async () => {
    setError('');
    setSiweResult('');
    if (!address) return;

    try {
      const client = getWalletClient();
      const nonce = crypto.randomUUID().replace(/-/g, '');
      const message = buildSiweMessage({
        domain: window.location.host,
        address,
        uri: window.location.origin,
        nonce,
        issuedAt: new Date().toISOString(),
        chainId: 480,
        statement: 'Sign in with World App',
      });

      const signature = await client.signMessage({
        account: address as `0x${string}`,
        message,
      });

      const res = await fetch('/api/verify-siwe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: { address, message, signature },
          nonce,
        }),
      });
      const data = await res.json();
      setSiweResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(`SIWE failed: ${e.message}`);
    }
  };

  const handleSignMessage = async () => {
    setError('');
    setSignResult('');
    if (!address) return;

    try {
      const client = getWalletClient();
      const signature = await client.signMessage({
        account: address as `0x${string}`,
        message: 'hello world',
      });
      setSignResult(signature);
    } catch (e: any) {
      setError(`Sign message failed: ${e.message}`);
    }
  };

  const handleMintToken = async () => {
    setError('');
    setTxHash('');
    setTrackHash('');
    if (!address) return;

    try {
      const client = getWalletClient();
      const data = encodeFunctionData({
        abi,
        functionName: 'mintToken',
      });
      const hash = await client.sendTransaction({
        account: address as `0x${string}`,
        to: STAGING_CONTRACT,
        data,
        chain: worldchain,
      });
      setTxHash(hash);
    } catch (e: any) {
      setError(`Mint failed: ${e.message}`);
    }
  };

  const handleTrackCalls = async () => {
    setError('');
    setTxHash('');
    setTrackHash('');
    if (!address) return;

    try {
      const client = getWalletClient();
      const data = encodeFunctionData({
        abi,
        functionName: 'trackCalls',
      });
      const hash = await client.sendTransaction({
        account: address as `0x${string}`,
        to: STAGING_CONTRACT,
        data,
        chain: worldchain,
      });
      setTrackHash(hash);
    } catch (e: any) {
      setError(`Track calls failed: ${e.message}`);
    }
  };

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">viem-test Demo</h1>
      <p className="text-sm text-gray-600">
        Pure viem + EIP-1193 provider. No wagmi.
        {isWorldApp ? ' (World App)' : ' (Browser)'}
      </p>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded text-sm break-all">
          {error}
        </div>
      )}

      {/* Connect Wallet */}
      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        <h2 className="font-semibold">1. Connect Wallet</h2>
        <button
          onClick={handleConnect}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          {address ? 'Reconnect' : 'Connect'}
        </button>
        {address && (
          <p className="text-sm text-green-700 break-all">
            Connected: {address}
          </p>
        )}
      </div>

      {/* SIWE Auth */}
      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        <h2 className="font-semibold">2. SIWE Auth</h2>
        <button
          onClick={handleSiwe}
          disabled={!address}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
        >
          Sign In (SIWE)
        </button>
        {siweResult && (
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
            {siweResult}
          </pre>
        )}
      </div>

      {/* Sign Message */}
      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        <h2 className="font-semibold">3. Sign Message</h2>
        <button
          onClick={handleSignMessage}
          disabled={!address}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
        >
          Sign &quot;hello world&quot;
        </button>
        {signResult && (
          <p className="text-xs break-all bg-gray-50 p-2 rounded">
            {signResult}
          </p>
        )}
      </div>

      {/* Send Transaction - Mint */}
      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        <h2 className="font-semibold">4. Send Transaction (Mint Token)</h2>
        <button
          onClick={handleMintToken}
          disabled={!address}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
        >
          Mint Token
        </button>
        {txHash && (
          <p className="text-xs break-all bg-gray-50 p-2 rounded">
            {isWorldApp ? 'UserOp' : 'Tx'} Hash: {txHash}
          </p>
        )}
      </div>

      {/* Send Transaction - Track Calls */}
      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        <h2 className="font-semibold">5. Send Transaction (Track Calls)</h2>
        <button
          onClick={handleTrackCalls}
          disabled={!address}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
        >
          Track Calls
        </button>
        {trackHash && (
          <p className="text-xs break-all bg-gray-50 p-2 rounded">
            {isWorldApp ? 'UserOp' : 'Tx'} Hash: {trackHash}
          </p>
        )}
      </div>

      {/* Receipt Polling */}
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
    </main>
  );
}
