/**
 * Wagmi fallback implementations for MiniKit commands
 *
 * These functions provide web fallback using Wagmi when not running in World App.
 * Wagmi is dynamically imported to avoid bundling it if not used.
 */

// We use `any` for the config type because wagmi is an optional peer dependency.
// Type safety is enforced at runtime through dynamic imports.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WagmiConfig = any;

// Store wagmi config on globalThis so it's shared across entry points
// (minikit-provider.js sets it, index.js reads it).
const WAGMI_KEY = '__minikit_wagmi_config__' as const;

export function setWagmiConfig(config: WagmiConfig): void {
  (globalThis as any)[WAGMI_KEY] = config;
}

export function getWagmiConfig(): WagmiConfig | undefined {
  return (globalThis as any)[WAGMI_KEY];
}

export function hasWagmiConfig(): boolean {
  return (globalThis as any)[WAGMI_KEY] !== undefined;
}

/**
 * Ensure a wallet is connected via Wagmi.
 * Uses the first configured connector (the wagmi config defines preference order).
 */
async function ensureConnected(config: WagmiConfig): Promise<`0x${string}`> {
  const { connect, getConnections } = await import('wagmi/actions');

  let connections = getConnections(config);
  if (connections.length > 0 && connections[0].accounts.length > 0) {
    return connections[0].accounts[0];
  }

  const connectors = config.connectors;
  if (!connectors || connectors.length === 0) {
    throw new Error('No Wagmi connectors configured');
  }
  await connect(config, { connector: connectors[0] });

  connections = getConnections(config);
  if (connections.length === 0 || connections[0].accounts.length === 0) {
    throw new Error('Failed to connect wallet');
  }
  return connections[0].accounts[0];
}

export interface WalletAuthParams {
  nonce: string;
  statement?: string;
  expirationTime?: Date;
}

export interface WalletAuthResult {
  address: string;
  message: string;
  signature: string;
}

/**
 * Execute wallet auth via Wagmi (connect + SIWE)
 */
export async function wagmiWalletAuth(
  params: WalletAuthParams,
): Promise<WalletAuthResult> {
  const config = getWagmiConfig();
  if (!config) {
    throw new Error(
      'Wagmi config not available. Pass wagmiConfig to MiniKitProvider.',
    );
  }

  const { signMessage } = await import('wagmi/actions');
  const { SiweMessage } = await import('siwe');

  const address = await ensureConnected(config);

  // EIP-4361 requires nonce to be alphanumeric (>= 8 chars).
  // callers often pass crypto.randomUUID() which contains hyphens.
  const nonce = params.nonce.replace(/[^a-zA-Z0-9]/g, '');

  const siweMessage = new SiweMessage({
    domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
    address,
    statement: params.statement,
    uri:
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost',
    version: '1',
    chainId: 480, // World Chain
    nonce,
    expirationTime: params.expirationTime?.toISOString(),
  });

  const message = siweMessage.prepareMessage();
  const signature = await signMessage(config, { message });

  return {
    address,
    message,
    signature,
  };
}

export interface SendTransactionParams {
  transactions: Array<{
    address: string;
    data?: string;
    value?: string;
  }>;
}

export interface SendTransactionResult {
  hashes: string[];
}

/**
 * Execute transactions via Wagmi (sequential, no batching)
 */
export async function wagmiSendTransaction(
  params: SendTransactionParams,
): Promise<SendTransactionResult> {
  const config = getWagmiConfig();
  if (!config) {
    throw new Error(
      'Wagmi config not available. Pass wagmiConfig to MiniKitProvider.',
    );
  }

  const { sendTransaction } = await import('wagmi/actions');

  await ensureConnected(config);

  // Execute transactions sequentially (Wagmi doesn't support batch natively)
  const hashes: string[] = [];
  for (const tx of params.transactions) {
    const hash = await sendTransaction(config, {
      to: tx.address as `0x${string}`,
      data: tx.data as `0x${string}` | undefined,
      value: tx.value ? BigInt(tx.value) : undefined,
    });
    hashes.push(hash);
  }

  return { hashes };
}
