import {
  MiniKit,
} from '@worldcoin/minikit-js';
import type {
  MiniKitSendTransactionOptions,
  MiniKitSignTypedDataOptions,
  SendTransactionResult,
  WalletAuthResult,
} from '@worldcoin/minikit-js/commands';
import { SiweMessage } from 'siwe';
import { type Hex } from 'viem';
import type { Config } from 'wagmi';
import {
  connect,
  getChainId,
  getConnections,
  sendTransaction,
  signMessage,
  signTypedData,
  switchChain,
} from 'wagmi/actions';

export type DemoExecutionMode = 'minikit' | 'wagmi';

export interface WagmiNativeSignMessageResult {
  status: 'success';
  version: number;
  signature: string;
  address: string;
}

export interface WagmiNativeSignTypedDataResult {
  status: 'success';
  version: number;
  signature: string;
  address: string;
}

type Address = `0x${string}`;
const WORLD_CHAIN_ID = 480;
type AnyConnector = any;
type CalldataTransaction = {
  to: string;
  data?: string;
  value?: string;
};

function toAddress(value: string): Address {
  if (!value.startsWith('0x')) {
    throw new Error('Connected wallet address is not a valid hex address.');
  }
  return value as Address;
}

function isWorldAppEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (MiniKit.isInWorldApp()) return true;
  } catch {
    // Fall back to window flag below.
  }

  return Boolean((window as any).WorldApp);
}

function selectConnector(config: Config, isWorldApp: boolean): AnyConnector {
  const connector = isWorldApp
    ? config.connectors.find((item) => item.id === 'worldApp')
    : config.connectors.find((item) => item.id !== 'worldApp');
  if (!connector) {
    throw new Error(
      isWorldApp
        ? 'No worldApp connector configured. Add worldApp() to route wagmi actions through MiniKit in World App.'
        : 'No web Wagmi connectors configured. Add injected() or walletConnect() after worldApp().',
    );
  }
  return connector;
}

async function ensureConnected(
  config: Config,
): Promise<{ address: Address; connector: AnyConnector }> {
  const isWorldApp = isWorldAppEnvironment();
  const connector = selectConnector(config, isWorldApp);

  const existingConnection = getConnections(config).find(
    (connection) =>
      connection.accounts.length > 0 &&
      connection.connector.id === connector.id,
  );
  if (existingConnection?.accounts[0]) {
    return { address: toAddress(existingConnection.accounts[0]), connector };
  }

  const result = await connect(config, { connector });
  const account = result.accounts[0];
  if (!account) {
    throw new Error('Failed to connect wallet with wagmi native actions.');
  }
  return { address: toAddress(account), connector };
}

function hasConfiguredChain(config: Config, chainId: number): boolean {
  return config.chains.some((chain) => chain.id === chainId);
}

async function ensureChain(
  config: Config,
  chainId?: number,
  options?: { requireConfigured?: boolean },
  connector?: AnyConnector,
): Promise<void> {
  const targetChainId = chainId ?? WORLD_CHAIN_ID;
  const requireConfigured = options?.requireConfigured ?? true;
  const isWorldApp = isWorldAppEnvironment();

  if (isWorldApp) {
    if (targetChainId !== WORLD_CHAIN_ID && requireConfigured) {
      throw new Error(
        `World App only supports World Chain (${WORLD_CHAIN_ID}) for this action.`,
      );
    }
    return;
  }

  if (!hasConfiguredChain(config, targetChainId)) {
    if (!requireConfigured) return;
    throw new Error(
      `Chain ${targetChainId} is not configured in wagmi. Add it to createConfig({ chains: [...] }).`,
    );
  }

  const currentChainId = await getChainId(config);
  if (currentChainId !== targetChainId) {
    await switchChain(config, { chainId: targetChainId, connector });
  }
}

function parseValue(value: string): bigint {
  return BigInt(value);
}

function isTransactionHash(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

function normalizeTransactions(
  options: MiniKitSendTransactionOptions,
): CalldataTransaction[] {
  if (options.transactions && options.transactions.length > 0) {
    return options.transactions;
  }

  if (!options.transaction || options.transaction.length === 0) {
    throw new Error(
      'At least one transaction is required in `transactions`.',
    );
  }

  return options.transaction.map((tx) => {
    if (!tx.data) {
      throw new Error(
        'ABI/functionName transactions are no longer supported in wagmi-native helper. Provide pre-encoded calldata in `transactions[].data`.',
      );
    }

    return {
      to: tx.address,
      data: tx.data,
      value: tx.value,
    };
  });
}

function resolveChainId(options: MiniKitSendTransactionOptions): number {
  if (options.network && options.network !== 'worldchain') {
    throw new Error('Only worldchain network is supported for now.');
  }

  if (options.chainId !== undefined && options.chainId !== WORLD_CHAIN_ID) {
    throw new Error(`Only chainId ${WORLD_CHAIN_ID} is supported for now.`);
  }

  return WORLD_CHAIN_ID;
}

export async function wagmiNativeWalletAuth(
  config: Config,
  input: {
    nonce: string;
    statement?: string;
    requestId?: string;
    expirationTime?: Date;
    notBefore?: Date;
  },
): Promise<WalletAuthResult> {
  const { address, connector } = await ensureConnected(config);
  const siweMessage = new SiweMessage({
    domain: window.location.host,
    address,
    statement: input.statement,
    uri: window.location.origin,
    version: '1',
    chainId: WORLD_CHAIN_ID,
    nonce: input.nonce,
    expirationTime: input.expirationTime?.toISOString(),
    notBefore: input.notBefore?.toISOString(),
    requestId: input.requestId,
  });

  const message = siweMessage.prepareMessage();
  const signature = await signMessage(config, {
    connector,
    account: address,
    message,
  });

  return {
    address,
    message,
    signature,
  };
}

export async function wagmiNativeSignMessage(
  config: Config,
  message: string,
): Promise<WagmiNativeSignMessageResult> {
  const { address, connector } = await ensureConnected(config);
  const signature = await signMessage(config, {
    connector,
    account: address,
    message,
  });

  return {
    status: 'success',
    version: 1,
    signature,
    address,
  };
}

export async function wagmiNativeSignTypedData(
  config: Config,
  payload: MiniKitSignTypedDataOptions,
): Promise<WagmiNativeSignTypedDataResult> {
  const domain = {
    ...(payload.domain as Record<string, unknown> | undefined),
    ...(payload.chainId !== undefined ? { chainId: payload.chainId } : {}),
  } as any;

  const { address, connector } = await ensureConnected(config);
  if (payload.chainId !== undefined) {
    await ensureChain(
      config,
      payload.chainId,
      { requireConfigured: false },
      connector,
    );
  }

  const signature = await signTypedData(config, {
    connector,
    account: address,
    types: payload.types as any,
    primaryType: payload.primaryType as any,
    domain,
    message: payload.message as any,
  });

  return {
    status: 'success',
    version: 1,
    signature,
    address,
  };
}

export async function wagmiNativeSendTransaction(
  config: Config,
  options: MiniKitSendTransactionOptions,
): Promise<SendTransactionResult> {
  const transactions = normalizeTransactions(options);
  const chainId = resolveChainId(options);

  if (options.permit2?.length) {
    throw new Error(
      'Direct wagmi mode does not support permit2 payloads. Use MiniKit mode for permit2 tests.',
    );
  }
  if (transactions.length !== 1) {
    throw new Error(
      'Direct wagmi mode supports a single transaction only in this demo. Use MiniKit mode for batch transactions.',
    );
  }

  const { address, connector } = await ensureConnected(config);
  await ensureChain(config, chainId, { requireConfigured: true }, connector);

  const tx = transactions[0];
  const response: Hex | string = await sendTransaction(config, {
    connector,
    account: address,
    chainId,
    to: tx.to as Address,
    ...(tx.data ? { data: tx.data as Hex } : {}),
    ...(tx.value !== undefined ? { value: parseValue(tx.value) } : {}),
  });

  if (isTransactionHash(response)) {
    return {
      status: 'success',
      version: 1,
      transactionHash: response,
      transactionId: null,
      transaction_id: null,
    };
  }

  // World App provider returns a MiniKit transaction id for eth_sendTransaction.
  return {
    status: 'success',
    version: 1,
    transactionHash: null,
    transactionId: response,
    transaction_id: response,
  };
}
