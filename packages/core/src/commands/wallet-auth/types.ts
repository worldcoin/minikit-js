import type {
  FallbackConfig,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

/** @deprecated Use {@link MiniKitWalletAuthOptions} instead */
export type WalletAuthInput = {
  nonce: string;
  statement?: string;
  requestId?: string;
  expirationTime?: Date;
  notBefore?: Date;
};

export type WalletAuthPayload = {
  siweMessage: string;
};

export enum WalletAuthErrorCodes {
  MalformedRequest = 'malformed_request',
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export const WalletAuthErrorMessage = {
  [WalletAuthErrorCodes.MalformedRequest]:
    'Provided parameters in the request are invalid.',
  [WalletAuthErrorCodes.UserRejected]: 'User rejected the request.',
  [WalletAuthErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export type MiniAppWalletAuthSuccessPayload = MiniAppBaseSuccessPayload & {
  message: string;
  signature: string;
  address: string;
};

export type MiniAppWalletAuthErrorPayload =
  MiniAppBaseErrorPayload<WalletAuthErrorCodes> & {
    details: (typeof WalletAuthErrorMessage)[WalletAuthErrorCodes];
  };

export type MiniAppWalletAuthPayload =
  | MiniAppWalletAuthSuccessPayload
  | MiniAppWalletAuthErrorPayload;

export interface MiniKitWalletAuthOptions<
  TCustomFallback = WalletAuthResult,
>
  extends FallbackConfig<TCustomFallback> {
  /** Nonce for SIWE message (alphanumeric, at least 8 chars) */
  nonce: string;

  /** Optional statement to include in SIWE message */
  statement?: string;

  /** Optional request ID for tracking */
  requestId?: string;

  /** Optional expiration time for the SIWE message */
  expirationTime?: Date;

  /** Optional not-before time for the SIWE message */
  notBefore?: Date;
}

export interface WalletAuthResult {
  /** Wallet address */
  address: string;
  /** Signed SIWE message */
  message: string;
  /** Signature */
  signature: string;
}

export type SiweMessage = {
  scheme?: string;
  domain: string;
  address?: string;
  statement?: string;
  uri: string;
  version: string;
  chain_id: number;
  nonce: string;
  issued_at: string;
  expiration_time?: string;
  not_before?: string;
  request_id?: string;
};

export class WalletAuthError extends Error {
  public readonly code: string;
  public readonly details?: string;

  constructor(code: string, details?: string) {
    super(details || `Wallet auth failed: ${code}`);
    this.name = 'WalletAuthError';
    this.code = code;
    this.details = details;
  }
}
