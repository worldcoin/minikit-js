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

// Wagmi config storage
let wagmiConfig: WagmiConfig | undefined;

/**
 * Set the Wagmi config for fallback support
 */
export function setWagmiConfig(config: WagmiConfig): void {
  wagmiConfig = config;
}

/**
 * Get the current Wagmi config
 */
export function getWagmiConfig(): WagmiConfig | undefined {
  return wagmiConfig;
}

/**
 * Check if Wagmi is configured for fallback
 */
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
  if (!wagmiConfig) {
    throw new Error('Wagmi config not available. Call MiniKit.configureWagmi() first.');
  }

  // Dynamic imports to avoid bundling Wagmi if not used
  const wagmiActions = await import('wagmi/actions');
  const { SiweMessage } = await import('siwe');

  const { connect, signMessage, getAccount, getConnections } = wagmiActions;

  // Connect if not already connected
  let account = getAccount(wagmiConfig);
  if (!account.isConnected) {
    const connections = getConnections(wagmiConfig);
    if (connections.length === 0) {
      // Get available connectors and try to connect
      const connectors = wagmiConfig.connectors;
      if (!connectors || connectors.length === 0) {
        throw new Error('No Wagmi connectors configured');
      }
      await connect(wagmiConfig, { connector: connectors[0] });
    }
    account = getAccount(wagmiConfig);
  }

  if (!account.address) {
    throw new Error('Failed to connect wallet');
  }

  // Generate SIWE message
  const siweMessage = new SiweMessage({
    domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
    address: account.address,
    statement: params.statement,
    uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    version: '1',
    chainId: 480, // World Chain
    nonce: params.nonce,
    expirationTime: params.expirationTime?.toISOString(),
  });

  const message = siweMessage.prepareMessage();
  const signature = await signMessage(wagmiConfig, { message });

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
  if (!wagmiConfig) {
    throw new Error('Wagmi config not available. Call MiniKit.configureWagmi() first.');
  }

  const wagmiActions = await import('wagmi/actions');
  const { sendTransaction, getAccount, connect, getConnections } = wagmiActions;

  // Ensure connected
  let account = getAccount(wagmiConfig);
  if (!account.isConnected) {
    const connections = getConnections(wagmiConfig);
    if (connections.length === 0) {
      const connectors = wagmiConfig.connectors;
      if (!connectors || connectors.length === 0) {
        throw new Error('No Wagmi connectors configured');
      }
      await connect(wagmiConfig, { connector: connectors[0] });
    }
    account = getAccount(wagmiConfig);
  }

  // Execute transactions sequentially (Wagmi doesn't support batch natively)
  const hashes: string[] = [];
  for (const tx of params.transactions) {
    const hash = await sendTransaction(wagmiConfig, {
      to: tx.address as `0x${string}`,
      data: tx.data as `0x${string}` | undefined,
      value: tx.value ? BigInt(tx.value) : undefined,
    });
    hashes.push(hash);
  }

  return { hashes };
}
