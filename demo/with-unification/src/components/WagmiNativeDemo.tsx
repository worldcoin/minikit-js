'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage, useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { Card } from './Card';

/**
 * Direction 1: Standard Wagmi App → World App
 *
 * This component uses ONLY wagmi hooks — zero MiniKit API calls.
 * In World App the worldApp() connector routes everything through native
 * MiniKit commands via the EIP-1193 provider shim. On web it falls back
 * to injected / WalletConnect as usual.
 */
export function WagmiNativeDemo() {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { sendTransactionAsync } = useSendTransaction();

  const [signResult, setSignResult] = useState<string>();
  const [txResult, setTxResult] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const handleSign = async () => {
    setBusy(true);
    setSignResult(undefined);
    setError(undefined);
    try {
      const sig = await signMessageAsync({ message: 'Hello from wagmi!' });
      setSignResult(sig);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!address) return;
    setBusy(true);
    setTxResult(undefined);
    setError(undefined);
    try {
      const hash = await sendTransactionAsync({
        to: address,
        value: parseEther('0'),
      });
      setTxResult(hash);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Standard Wagmi App"
      description="Zero MiniKit code — wagmi hooks only. In World App the worldApp() connector routes through native MiniKit."
    >
      {/* Connect / Disconnect */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isConnected ? (
          connectors.map((c) => (
            <button
              key={c.uid}
              onClick={() => connect({ connector: c })}
              disabled={isConnecting}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : `Connect ${c.name}`}
            </button>
          ))
        ) : (
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Connected state */}
      {isConnected && address && (
        <div className="space-y-3">
          <p className="text-sm font-mono break-all">
            <span className="text-muted">Connected:</span> {address}
            {connector && (
              <span className="text-muted"> via {connector.name}</span>
            )}
          </p>

          {/* Sign Message */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSign}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
            >
              {busy && !txResult ? 'Signing...' : 'Sign Message'}
            </button>
          </div>
          {signResult && (
            <pre className="text-xs text-muted overflow-x-auto whitespace-pre-wrap break-all bg-card border border-border rounded-md p-2">
              {signResult}
            </pre>
          )}

          {/* Send Transaction */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSend}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
            >
              {busy && !signResult ? 'Sending...' : 'Send 0 ETH to self'}
            </button>
          </div>
          {txResult && (
            <pre className="text-xs text-muted overflow-x-auto whitespace-pre-wrap break-all bg-card border border-border rounded-md p-2">
              {txResult}
            </pre>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-error/10 border border-error/30 p-3 text-sm">
          <span className="font-semibold text-error">Error: </span>
          <span className="text-error/80">{error}</span>
        </div>
      )}

      <p className="text-xs text-muted border-t border-border pt-3">
        In World App: <code>worldApp()</code> connector routes through MiniKit natively.
        <br />
        On web: injected / WalletConnect wallet as usual.
      </p>
    </Card>
  );
}
