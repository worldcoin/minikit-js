export type WalletAuthAdapterParams = {
  nonce: string;
  statement?: string;
  expirationTime?: Date;
};

export type WalletAuthAdapterResult = {
  address: string;
  message: string;
  signature: string;
};

export type SignMessageAdapterParams = {
  message: string;
};

export type SignMessageAdapterResult = {
  status: 'success';
  version: number;
  signature: string;
  address: string;
};

export type SignTypedDataAdapterParams = {
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
  domain?: Record<string, unknown>;
  chainId?: number;
};

export type SignTypedDataAdapterResult = {
  status: 'success';
  version: number;
  signature: string;
  address: string;
};

export type SendTransactionAdapterParams = {
  transaction: {
    address: string;
    data?: string;
    value?: string;
  };
  chainId?: number;
};

export type SendTransactionAdapterResult = {
  transactionHash: string;
};

export type FallbackAdapter = {
  walletAuth?: (
    params: WalletAuthAdapterParams,
  ) => Promise<WalletAuthAdapterResult>;
  signMessage?: (
    params: SignMessageAdapterParams,
  ) => Promise<SignMessageAdapterResult>;
  signTypedData?: (
    params: SignTypedDataAdapterParams,
  ) => Promise<SignTypedDataAdapterResult>;
  sendTransaction?: (
    params: SendTransactionAdapterParams,
  ) => Promise<SendTransactionAdapterResult>;
};

const FALLBACK_ADAPTER_KEY = '__minikit_fallback_adapter__' as const;

export function setFallbackAdapter(adapter: FallbackAdapter): void {
  (globalThis as any)[FALLBACK_ADAPTER_KEY] = adapter;
}

export function getFallbackAdapter(): FallbackAdapter | undefined {
  return (globalThis as any)[FALLBACK_ADAPTER_KEY];
}

export function hasFallbackAdapter(): boolean {
  return (globalThis as any)[FALLBACK_ADAPTER_KEY] !== undefined;
}
