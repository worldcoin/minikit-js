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
const SIWE_NONCE_REGEX = /^[a-zA-Z0-9]{8,}$/;

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
 * Tries configured connectors in order and skips the World App connector on web.
 */
async function ensureConnected(config: WagmiConfig): Promise<`0x${string}`> {
  const { connect, getConnections } = await import('wagmi/actions');
  const isWorldApp =
    typeof window !== 'undefined' && Boolean((window as any).WorldApp);

  const existingConnection = getConnections(config).find(
    (connection: {
      accounts?: readonly `0x${string}`[];
      connector?: { id?: string };
    }) =>
      connection.accounts &&
      connection.accounts.length > 0 &&
      (isWorldApp || connection.connector?.id !== 'worldApp'),
  );
  if (existingConnection && existingConnection.accounts) {
    return existingConnection.accounts[0];
  }

  const connectors = config.connectors;
  if (!connectors || connectors.length === 0) {
    throw new Error('No Wagmi connectors configured');
  }

  const candidateConnectors = isWorldApp
    ? connectors
    : connectors.filter((connector: { id?: string }) => connector.id !== 'worldApp');
  if (!isWorldApp && candidateConnectors.length === 0) {
    throw new Error(
      'No web Wagmi connectors configured. Add a web connector (e.g. injected or walletConnect) after worldApp().',
    );
  }

  let lastError: unknown;
  for (const connector of candidateConnectors) {
    try {
      const result = await connect(config, { connector });
      if (result.accounts.length > 0) {
        const account = result.accounts[0];
        const address =
          typeof account === 'string'
            ? account
            : (account as { address?: `0x${string}` }).address;
        if (address) {
          return address;
        }
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Failed to connect wallet');
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

export interface SignMessageParams {
  message: string;
}

export interface SignMessageResult {
  status: 'success';
  version: number;
  signature: string;
  address: string;
}

export interface SignTypedDataParams {
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
  domain?: Record<string, unknown>;
  chainId?: number;
}

export interface SignTypedDataResult {
  status: 'success';
  version: number;
  signature: string;
  address: string;
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

  if (!SIWE_NONCE_REGEX.test(params.nonce)) {
    throw new Error(
      "Invalid nonce: must be alphanumeric and at least 8 characters (EIP-4361)",
    );
  }

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
    nonce: params.nonce,
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

/**
 * Execute sign message via Wagmi
 */
export async function wagmiSignMessage(
  params: SignMessageParams,
): Promise<SignMessageResult> {
  const config = getWagmiConfig();
  if (!config) {
    throw new Error(
      'Wagmi config not available. Pass wagmiConfig to MiniKitProvider.',
    );
  }

  const { signMessage } = await import('wagmi/actions');

  const address = await ensureConnected(config);
  const signature = await signMessage(config, {
    account: address,
    message: params.message,
  });

  return {
    status: 'success',
    version: 1,
    signature,
    address,
  };
}

/**
 * Execute sign typed data via Wagmi
 */
export async function wagmiSignTypedData(
  params: SignTypedDataParams,
): Promise<SignTypedDataResult> {
  const config = getWagmiConfig();
  if (!config) {
    throw new Error(
      'Wagmi config not available. Pass wagmiConfig to MiniKitProvider.',
    );
  }

  const { getChainId, signTypedData, switchChain } = await import(
    'wagmi/actions'
  );

  const address = await ensureConnected(config);

  if (params.chainId !== undefined) {
    const currentChainId = await getChainId(config);
    if (currentChainId !== params.chainId) {
      await switchChain(config, { chainId: params.chainId });
    }
  }

  const signature = await signTypedData(config, {
    account: address,
    types: params.types as any,
    primaryType: params.primaryType as any,
    domain: params.domain as any,
    message: params.message as any,
  });

  return {
    status: 'success',
    version: 1,
    signature,
    address,
  };
}

export interface SendTransactionParams {
  transactions: Array<{
    address: string;
    data?: string;
    value?: string;
  }>;
  chainId?: number;
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

  const { getChainId, sendTransaction, switchChain } = await import(
    'wagmi/actions'
  );

  await ensureConnected(config);

  if (params.chainId !== undefined) {
    const currentChainId = await getChainId(config);
    if (currentChainId !== params.chainId) {
      await switchChain(config, { chainId: params.chainId });
    }
  }

  // Execute transactions sequentially (Wagmi doesn't support batch natively)
  const hashes: string[] = [];
  for (const tx of params.transactions) {
    const hash = await sendTransaction(config, {
      chainId: params.chainId,
      to: tx.address as `0x${string}`,
      data: tx.data as `0x${string}` | undefined,
      value: tx.value ? BigInt(tx.value) : undefined,
    });
    hashes.push(hash);
  }

  return { hashes };
}
