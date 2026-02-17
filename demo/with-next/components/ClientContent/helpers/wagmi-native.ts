import type {
  MiniKitSendTransactionOptions,
  MiniKitSignTypedDataOptions,
  WalletAuthResult,
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

export interface WagmiNativeSendTransactionResult {
  status: 'success';
  version: number;
  transactionHash: string;
}

type Address = `0x${string}`;
const WORLD_CHAIN_ID = 480;

function toAddress(value: string): Address {
  if (!value.startsWith('0x')) {
    throw new Error('Connected wallet address is not a valid hex address.');
  }
  return value as Address;
}

function isWorldAppEnvironment(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).WorldApp);
}

async function ensureConnected(config: Config): Promise<Address> {
  const isWorldApp = isWorldAppEnvironment();
  const existingConnection = getConnections(config).find(
    (connection) =>
      connection.accounts.length > 0 &&
      (isWorldApp || connection.connector.id !== 'worldApp'),
  );

  if (existingConnection?.accounts[0]) {
    return toAddress(existingConnection.accounts[0]);
  }

  const candidateConnectors = isWorldApp
    ? config.connectors
    : config.connectors.filter((connector) => connector.id !== 'worldApp');

  if (candidateConnectors.length === 0) {
    throw new Error(
      isWorldApp
        ? 'No Wagmi connectors configured. Add worldApp() to route wagmi actions through MiniKit in World App.'
        : 'No web Wagmi connectors configured. Add injected() or walletConnect() after worldApp().',
    );
  }

  const result = await connect(config, { connector: candidateConnectors[0] });
  const account = result.accounts[0];

  if (!account) {
    throw new Error('Failed to connect wallet with wagmi native actions.');
  }

  return toAddress(account);
}

async function ensureChain(config: Config, chainId?: number): Promise<void> {
  const targetChainId = chainId ?? WORLD_CHAIN_ID;
  const currentChainId = await getChainId(config);
  if (currentChainId !== targetChainId) {
    await switchChain(config, { chainId: targetChainId });
  }
}

function parseValue(value: string): bigint {
  return BigInt(value);
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
  const address = await ensureConnected(config);
  await ensureChain(config, WORLD_CHAIN_ID);

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
  const signature = await signMessage(config, { account: address, message });

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
  const address = await ensureConnected(config);
  const signature = await signMessage(config, {
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
  const address = await ensureConnected(config);
  if (payload.chainId !== undefined) {
    await ensureChain(config, payload.chainId);
  }

  const signature = await signTypedData(config, {
    account: address,
    types: payload.types as any,
    primaryType: payload.primaryType as any,
    domain: {
      ...(payload.domain as Record<string, unknown> | undefined),
      ...(payload.chainId !== undefined ? { chainId: payload.chainId } : {}),
    } as any,
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
): Promise<WagmiNativeSendTransactionResult> {
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

  const address = await ensureConnected(config);
  await ensureChain(config, options.chainId);

  const tx = options.transaction[0];
  let hash: Hex;
  if (tx.data && tx.data !== '0x') {
    hash = await sendTransaction(config, {
      account: address,
      chainId: options.chainId ?? WORLD_CHAIN_ID,
      to: tx.address as Address,
      data: tx.data as Hex,
      ...(tx.value !== undefined ? { value: parseValue(tx.value) } : {}),
    });
  } else {
    hash = await writeContract(config, {
      account: address,
      chainId: options.chainId ?? WORLD_CHAIN_ID,
      address: tx.address as Address,
      abi: tx.abi as Abi,
      functionName: tx.functionName as string,
      args: tx.args as readonly unknown[],
      ...(tx.value !== undefined ? { value: parseValue(tx.value) } : {}),
    });
  }

  return {
    status: 'success',
    version: 1,
    transactionHash: hash,
  };
}
