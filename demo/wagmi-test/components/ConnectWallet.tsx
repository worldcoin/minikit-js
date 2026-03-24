'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { MiniKit } from '@worldcoin/minikit-js';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [siweResult, setSiweResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConnect = () => {
    setError('');
    // Use worldApp in World App, injected (MetaMask) in browser
    const preferredId = MiniKit.isInWorldApp() ? 'worldApp' : 'injected';
    const connector =
      connectors.find((c) => c.id === preferredId) ?? connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const handleSiwe = async () => {
    setError('');
    setSiweResult('');
    if (!address) return;

    try {
      const nonce = crypto.randomUUID().replace(/-/g, '');
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with World App',
        uri: window.location.origin,
        version: '1',
        chainId: 480,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      const message = siweMessage.prepareMessage();
      const signature = await signMessageAsync({ message });

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

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-2">
      <h2 className="font-semibold">1. Connect Wallet + SIWE</h2>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded text-sm break-all">
          {error}
        </div>
      )}

      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-green-700 break-all">
            Connected: {address}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSiwe}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
            >
              Sign In (SIWE)
            </button>
            <button
              onClick={() => disconnect()}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {siweResult && (
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
          {siweResult}
        </pre>
      )}
    </div>
  );
}
