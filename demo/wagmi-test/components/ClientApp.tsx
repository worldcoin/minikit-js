'use client';

import { ConnectWallet } from './ConnectWallet';
import { SignMessage } from './SignMessage';
import { SendTransaction } from './SendTransaction';

export default function ClientApp() {
  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">wagmi-test Demo</h1>
      <p className="text-sm text-gray-600">
        Pure wagmi hooks + worldApp() connector. No MiniKit high-level API.
      </p>
      <ConnectWallet />
      <SignMessage />
      <SendTransaction />
    </main>
  );
}
