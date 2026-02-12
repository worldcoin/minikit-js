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

let wagmiConfig: WagmiConfig | undefined;

export function setWagmiConfig(config: WagmiConfig): void {
  wagmiConfig = config;
}

export function getWagmiConfig(): WagmiConfig | undefined {
  return wagmiConfig;
}

export function hasWagmiConfig(): boolean {
  return wagmiConfig !== undefined;
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
  params: WalletAuthParams
): Promise<WalletAuthResult> {
  const config = getWagmiConfig();
  if (!config) {
    throw new Error('Wagmi config not available. Pass wagmiConfig to MiniKitProvider.');
  }

  const wagmiActions = await import('wagmi/actions');
  const { SiweMessage } = await import('siwe');
  const { connect, signMessage, getAccount, getConnections } = wagmiActions;

  // Connect if not already connected
  let account = getAccount(config);
  if (!account.isConnected) {
    const connections = getConnections(config);
    if (connections.length === 0) {
      const connectors = config.connectors;
      if (!connectors || connectors.length === 0) {
        throw new Error('No Wagmi connectors configured');
      }
      await connect(config, { connector: connectors[0] });
    }
    account = getAccount(config);
  }

  if (!account.address) {
    throw new Error('Failed to connect wallet');
  }

  // EIP-4361 requires nonce to be alphanumeric (>= 8 chars).
  // callers often pass crypto.randomUUID() which contains hyphens.
  const nonce = params.nonce.replace(/[^a-zA-Z0-9]/g, '');

  const siweMessage = new SiweMessage({
    domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
    address: account.address,
    statement: params.statement,
    uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    version: '1',
    chainId: 480, // World Chain
    nonce,
    expirationTime: params.expirationTime?.toISOString(),
  });

  const message = siweMessage.prepareMessage();
  const signature = await signMessage(config, { message });

  return {
    address: account.address,
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
  params: SendTransactionParams
): Promise<SendTransactionResult> {
  const config = getWagmiConfig();
  if (!config) {
    throw new Error('Wagmi config not available. Pass wagmiConfig to MiniKitProvider.');
  }

  const wagmiActions = await import('wagmi/actions');
  const { sendTransaction, getAccount, connect, getConnections } = wagmiActions;

  // Ensure connected
  let account = getAccount(config);
  if (!account.isConnected) {
    const connections = getConnections(config);
    if (connections.length === 0) {
      const connectors = config.connectors;
      if (!connectors || connectors.length === 0) {
        throw new Error('No Wagmi connectors configured');
      }
      await connect(config, { connector: connectors[0] });
    }
    account = getAccount(config);
  }

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
