'use client';

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

export function SignMessage() {
  const { isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [input, setInput] = useState('hello world');
  const [signature, setSignature] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSign = async () => {
    setError('');
    setSignature('');
    try {
      const sig = await signMessageAsync({ message: input });
      setSignature(sig);
    } catch (e: any) {
      setError(`Sign failed: ${e.message}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-2">
      <h2 className="font-semibold">2. Sign Message</h2>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded text-sm break-all">
          {error}
        </div>
      )}

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
        placeholder="Message to sign"
      />
      <button
        onClick={handleSign}
        disabled={!isConnected}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:opacity-50"
      >
        Sign Message
      </button>

      {signature && (
        <p className="text-xs break-all bg-gray-50 p-2 rounded">{signature}</p>
      )}
    </div>
  );
}
