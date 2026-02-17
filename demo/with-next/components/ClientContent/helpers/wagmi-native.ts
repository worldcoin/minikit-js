import {
  MiniKit,
  type MiniKitSendTransactionOptions,
  type MiniKitSignTypedDataOptions,
  type SendTransactionResult,
  type WalletAuthResult,
} from '@worldcoin/minikit-js';
import { SiweMessage } from 'siwe';
import { type Abi, type Hex } from 'viem';
import type { Config } from 'wagmi';
import {
  connect,
  getChainId,
  getConnections,
  sendTransaction,
  signMessage,
  signTypedData,
  switchChain,
  writeContract,
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
const ACTION_TIMEOUT_MS = 45000;
type AnyConnector = any;

async function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = ACTION_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${Math.floor(timeoutMs / 1000)}s.`,
        ),
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

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

  const result = await withTimeout(connect(config, { connector }), 'wagmi connect');
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
  const signature = await withTimeout(
    signMessage(config, {
      connector,
      account: address,
      message,
    }),
    'wagmi signMessage(walletAuth)',
  );

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
  const signature = await withTimeout(
    signMessage(config, {
      connector,
      account: address,
      message,
    }),
    'wagmi signMessage',
  );

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

  const signature = await withTimeout(
    signTypedData(config, {
      connector,
      account: address,
      types: payload.types as any,
      primaryType: payload.primaryType as any,
      domain,
      message: payload.message as any,
    }),
    'wagmi signTypedData',
  );

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
  if (options.permit2?.length) {
    throw new Error(
      'Direct wagmi mode does not support permit2 payloads. Use MiniKit mode for permit2 tests.',
    );
  }
  if (options.transaction.length !== 1) {
    throw new Error(
      'Direct wagmi mode supports a single transaction only in this demo. Use MiniKit mode for batch transactions.',
    );
  }

  const { address, connector } = await ensureConnected(config);
  await ensureChain(
    config,
    options.chainId,
    { requireConfigured: true },
    connector,
  );

  const tx = options.transaction[0];
  let response: Hex | string;
  if (tx.data && tx.data !== '0x') {
    response = await withTimeout(
      sendTransaction(config, {
        connector,
        account: address,
        chainId: options.chainId ?? WORLD_CHAIN_ID,
        to: tx.address as Address,
        data: tx.data as Hex,
        ...(tx.value !== undefined ? { value: parseValue(tx.value) } : {}),
      }),
      'wagmi sendTransaction',
    );
  } else {
    response = await withTimeout(
      writeContract(config, {
        connector,
        account: address,
        chainId: options.chainId ?? WORLD_CHAIN_ID,
        address: tx.address as Address,
        abi: tx.abi as Abi,
        functionName: tx.functionName as string,
        args: tx.args as readonly unknown[],
        ...(tx.value !== undefined ? { value: parseValue(tx.value) } : {}),
      }),
      'wagmi writeContract',
    );
  }

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
