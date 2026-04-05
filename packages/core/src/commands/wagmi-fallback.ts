/**
 * Wagmi fallback implementations for MiniKit commands
 *
 * These functions provide web fallback using Wagmi when not running in World App.
 * Wagmi is dynamically imported to avoid bundling it if not used.
 */
import { PartialExecutionError } from './fallback';
import { setFallbackAdapter } from './fallback-adapter-registry';

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
  registerWagmiFallbacks();
}

export function getWagmiConfig(): WagmiConfig | undefined {
  return (globalThis as any)[WAGMI_KEY];
}

export function hasWagmiConfig(): boolean {
  return (globalThis as any)[WAGMI_KEY] !== undefined;
}

export function registerWagmiFallbacks(): void {
  setFallbackAdapter({
    walletAuth: wagmiWalletAuth,
    signMessage: wagmiSignMessage,
    signTypedData: wagmiSignTypedData,
    sendTransaction: wagmiSendTransaction,
  });
}

// Use variables for dynamic imports so bundlers cannot statically resolve them.
// wagmi, siwe, and viem are optional peer dependencies — apps that don't install
// them should not fail at build time.
const WAGMI_ACTIONS = 'wagmi/actions';
const SIWE_MODULE = 'siwe';
const VIEM_MODULE = 'viem';

async function loadWagmiActions(): Promise<any> {
  // Temporary diagnostics for external fallback debugging.
  console.log('[MiniKit WagmiFallback] loadWagmiActions:start', {
    hasWindow: typeof window !== 'undefined',
    hasWagmiConfig: hasWagmiConfig(),
  });
  try {
    const actions = await import(WAGMI_ACTIONS);
    console.log('[MiniKit WagmiFallback] loadWagmiActions:success');
    return actions;
  } catch (error) {
    console.log('[MiniKit WagmiFallback] loadWagmiActions:error', {
      message: error instanceof Error ? error.message : String(error),
    });
    const wrappedError = new Error(
      'Wagmi fallback requires the "wagmi" package. Install wagmi or provide a custom fallback.',
    );
    (wrappedError as Error & { cause?: unknown }).cause = error;
    throw wrappedError;
  }
}

async function loadSiwe(): Promise<any> {
  try {
    return await import(SIWE_MODULE);
  } catch (error) {
    const wrappedError = new Error(
      'Wagmi walletAuth fallback requires the "siwe" package. Install siwe or provide a custom fallback.',
    );
    (wrappedError as Error & { cause?: unknown }).cause = error;
    throw wrappedError;
  }
}

/**
 * Ensure a wallet is connected via Wagmi.
 * Tries configured connectors in order and skips the World App connector on web.
 */
async function checksumAddress(addr: string): Promise<`0x${string}`> {
  try {
    const { getAddress } = await import(VIEM_MODULE);
    return getAddress(addr) as `0x${string}`;
  } catch {
    return addr as `0x${string}`;
  }
}

async function ensureConnected(config: WagmiConfig): Promise<`0x${string}`> {
  const { connect, getConnections } = await loadWagmiActions();
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
    return checksumAddress(existingConnection.accounts[0]);
  }

  const connectors = config.connectors;
  if (!connectors || connectors.length === 0) {
    throw new Error('No Wagmi connectors configured');
  }

  const candidateConnectors = isWorldApp
    ? connectors
    : connectors.filter(
        (connector: { id?: string }) => connector.id !== 'worldApp',
      );
  if (!isWorldApp && candidateConnectors.length === 0) {
    throw new Error(
      'No web Wagmi connectors configured. Add a web connector (e.g. injected or walletConnect) after worldApp().',
    );
  }

  const selectedConnector = candidateConnectors[0];

  try {
    const result = await connect(config, { connector: selectedConnector });
    if (result.accounts.length > 0) {
      const account = result.accounts[0];
      const address =
        typeof account === 'string'
          ? account
          : (account as { address?: `0x${string}` }).address;
      if (address) {
        return checksumAddress(address);
      }
    }
  } catch (error) {
    const connectorId = (selectedConnector as { id?: string }).id ?? 'unknown';
    const wrappedError = new Error(
      `Failed to connect with connector "${connectorId}". Reorder connectors to change the default connector.`,
    );
    (wrappedError as Error & { cause?: unknown }).cause = error;
    throw wrappedError;
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
  console.log('[MiniKit WagmiFallback] walletAuth:start', {
    hasWagmiConfig: hasWagmiConfig(),
    nonceLength: params.nonce?.length ?? 0,
  });
  const config = getWagmiConfig();
  if (!config) {
    console.log('[MiniKit WagmiFallback] walletAuth:error:no-config');
    throw new Error(
      'Wagmi config not available. Pass wagmiConfig to MiniKitProvider.',
    );
  }

  const { signMessage } = await loadWagmiActions();
  const { SiweMessage } = await loadSiwe();

  const address = await ensureConnected(config);

  if (!SIWE_NONCE_REGEX.test(params.nonce)) {
    throw new Error(
      'Invalid nonce: must be alphanumeric and at least 8 characters (EIP-4361)',
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
  console.log('[MiniKit WagmiFallback] signMessage:start', {
    hasWagmiConfig: hasWagmiConfig(),
  });
  const config = getWagmiConfig();
  if (!config) {
    console.log('[MiniKit WagmiFallback] signMessage:error:no-config');
    throw new Error(
      'Wagmi config not available. Pass wagmiConfig to MiniKitProvider.',
    );
  }

  const { signMessage } = await loadWagmiActions();

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
  console.log('[MiniKit WagmiFallback] signTypedData:start', {
    hasWagmiConfig: hasWagmiConfig(),
    hasChainId: params.chainId !== undefined,
  });
  const config = getWagmiConfig();
  if (!config) {
    console.log('[MiniKit WagmiFallback] signTypedData:error:no-config');
    throw new Error(
      'Wagmi config not available. Pass wagmiConfig to MiniKitProvider.',
    );
  }

  const { getChainId, signTypedData, switchChain } = await loadWagmiActions();

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
  transactions: {
    address: string;
    data?: string;
    value?: string;
  }[];
  chainId?: number;
}

export interface SendTransactionResult {
  transactionHash: string;
}

function isChainMismatchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('does not match the target chain');
}

/**
 * Execute transaction(s) via Wagmi sequentially.
 * Each transaction is sent individually and requires wallet confirmation.
 * Returns the hash of the last transaction.
 *
 * Note: Unlike World App, web execution is NOT atomic — if a later transaction
 * fails, earlier ones are already confirmed and cannot be rolled back.
 */
export async function wagmiSendTransaction(
  params: SendTransactionParams,
): Promise<SendTransactionResult> {
  console.log('[MiniKit WagmiFallback] sendTransaction:start', {
    hasWagmiConfig: hasWagmiConfig(),
    chainId: params.chainId,
    txCount: params.transactions.length,
  });
  if (params.transactions.length === 0) {
    throw new Error('At least one transaction is required');
  }
  const config = getWagmiConfig();
  if (!config) {
    console.log('[MiniKit WagmiFallback] sendTransaction:error:no-config');
    throw new Error(
      'Wagmi config not available. Pass wagmiConfig to MiniKitProvider.',
    );
  }

  const { getChainId, getWalletClient, sendTransaction, switchChain } =
    await loadWagmiActions();

  await ensureConnected(config);

  const targetChainId =
    params.chainId ??
    (config as { chains?: Array<{ id: number }> }).chains?.[0]?.id;

  const ensureTargetChain = async () => {
    if (targetChainId === undefined) return;

    const currentChainId = await getChainId(config);
    if (currentChainId !== targetChainId) {
      await switchChain(config, { chainId: targetChainId });
    }

    const walletClient = await getWalletClient(config);
    const providerChainId = walletClient
      ? await walletClient.getChainId()
      : await getChainId(config);

    if (providerChainId !== targetChainId) {
      throw new Error(
        `Wallet network mismatch: expected chain ${targetChainId}, got ${providerChainId}. Please switch networks in your wallet and retry.`,
      );
    }
  };

  await ensureTargetChain();

  const sendWithChainRetry = async (
    tx: (typeof params.transactions)[number],
  ): Promise<`0x${string}`> => {
    const send = () =>
      sendTransaction(config, {
        chainId: targetChainId,
        to: tx.address as `0x${string}`,
        data: tx.data as `0x${string}` | undefined,
        value: tx.value ? BigInt(tx.value) : undefined,
      });
    try {
      return await send();
    } catch (error) {
      if (targetChainId !== undefined && isChainMismatchError(error)) {
        await ensureTargetChain();
        return await send();
      }
      throw error;
    }
  };

  const submitted: `0x${string}`[] = [];

  for (let i = 0; i < params.transactions.length; i++) {
    try {
      submitted.push(await sendWithChainRetry(params.transactions[i]));
    } catch (error) {
      if (submitted.length > 0) {
        throw new PartialExecutionError(
          `Transaction ${i + 1}/${params.transactions.length} failed after ${submitted.length} tx(s) were already submitted. Resolve manually.`,
          submitted,
          error,
        );
      }
      throw error;
    }
  }

  return { transactionHash: submitted[submitted.length - 1] };
}
