'use client';

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useConnectors, useDisconnect, useSignMessage, useSendTransaction, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { Card } from './Card';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// WLD token on World Chain
const WLD_TOKEN = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003' as const;

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
  const { mutate: connect, isPending: isConnecting } = useConnect();
  const connectors = useConnectors();
  const { mutate: disconnect } = useDisconnect();
  const { mutateAsync: signMessageAsync } = useSignMessage();
  const { mutateAsync: sendTransactionAsync } = useSendTransaction();
  const { mutateAsync: writeContractAsync } = useWriteContract();

  // Defer connector list rendering to avoid SSR hydration mismatch —
  // wagmi discovers connectors (EIP-6963) only on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [signResult, setSignResult] = useState<string>();
  const [txResult, setTxResult] = useState<string>();
  const [writeResult, setWriteResult] = useState<string>();
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

  const handleWriteContract = async () => {
    if (!address) return;
    setBusy(true);
    setWriteResult(undefined);
    setError(undefined);
    try {
      const hash = await writeContractAsync({
        address: WLD_TOKEN,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [address, BigInt(0)],
      });
      setWriteResult(hash);
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
      {/* Gate all dynamic wagmi state behind mounted to avoid SSR hydration mismatch —
          wagmi discovers connectors (EIP-6963) and may auto-reconnect only on the client. */}
      {!mounted ? (
        <span className="text-sm text-muted">Loading...</span>
      ) : (
        <>
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

              {/* Send Transaction (value transfer) */}
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

              {/* Write Contract (useWriteContract) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleWriteContract}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
                >
                  {busy && !signResult && !txResult ? 'Writing...' : 'Write Contract (ERC-20 transfer)'}
                </button>
              </div>
              {writeResult && (
                <pre className="text-xs text-muted overflow-x-auto whitespace-pre-wrap break-all bg-card border border-border rounded-md p-2">
                  {writeResult}
                </pre>
              )}
            </div>
          )}
        </>
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
