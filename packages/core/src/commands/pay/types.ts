import type {
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
  FallbackConfig,
} from '../types';

// ============================================================================
// Payment Primitives (moved from types/payment.ts)
// ============================================================================

export enum Tokens {
  USDC = 'USDCE',
  WLD = 'WLD',
}

export const TokenDecimals: { [key in Tokens]: number } = {
  [Tokens.USDC]: 6,
  [Tokens.WLD]: 18,
};

export enum Network {
  Optimism = 'optimism',
  WorldChain = 'worldchain',
}

// ============================================================================
// Pay Command Types
// ============================================================================

export type TokensPayload = {
  symbol: Tokens;
  token_amount: string;
};

/** @deprecated Use {@link MiniKitPayOptions} instead */
export type PayCommandInput = {
  reference: string;
  to: `0x${string}` | string;
  tokens: TokensPayload[];
  network?: Network;
  description: string;
};

/** @deprecated Use {@link MiniKitPayOptions} instead */
export type PayCommandPayload = PayCommandInput;

export enum PaymentErrorCodes {
  InputError = 'input_error',
  UserRejected = 'user_rejected',
  PaymentRejected = 'payment_rejected',
  InvalidReceiver = 'invalid_receiver',
  InsufficientBalance = 'insufficient_balance',
  TransactionFailed = 'transaction_failed',
  GenericError = 'generic_error',
  UserBlocked = 'user_blocked',
}

export const PaymentErrorMessage: Record<PaymentErrorCodes, string> = {
  [PaymentErrorCodes.InputError]:
    'There was a problem with this request. Please try again or contact the app owner.',
  [PaymentErrorCodes.UserRejected]:
    'You have cancelled the payment in World App.',
  [PaymentErrorCodes.PaymentRejected]:
    "You've cancelled the payment in World App.",
  [PaymentErrorCodes.InvalidReceiver]:
    'The receiver address is invalid. Please contact the app owner.',
  [PaymentErrorCodes.InsufficientBalance]:
    'You do not have enough balance to complete this transaction.',
  [PaymentErrorCodes.TransactionFailed]:
    'The transaction failed. Please try again.',
  [PaymentErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
  [PaymentErrorCodes.UserBlocked]:
    "User's region is blocked from making payments.",
};

export type MiniAppPaymentSuccessPayload = MiniAppBaseSuccessPayload & {
  transaction_status: 'submitted';
  transaction_id: string;
  reference: string;
  from: string;
  chain: Network;
  timestamp: string;
};

export type MiniAppPaymentErrorPayload =
  MiniAppBaseErrorPayload<PaymentErrorCodes>;

export type MiniAppPaymentPayload =
  | MiniAppPaymentSuccessPayload
  | MiniAppPaymentErrorPayload;

export interface MiniKitPayOptions<TCustomFallback = unknown>
  extends FallbackConfig<TCustomFallback> {
  /** Unique reference for this payment (for tracking) */
  reference: string;

  /** Recipient address */
  to: `0x${string}` | string;

  /** Token(s) and amount(s) to send */
  tokens: TokensPayload[];

  /** Payment description shown to user */
  description: string;

  /** Network (defaults to World Chain) */
  network?: Network;
}

export interface PayResult {
  /** Transaction hash/ID */
  transactionId: string;
  /** Reference that was passed in */
  reference: string;
  /** From address */
  from: string;
  /** Chain used */
  chain: Network;
  /** Timestamp */
  timestamp: string;
}

export class PayError extends Error {
  public readonly code: string;

  constructor(code: string) {
    super(`Payment failed: ${code}`);
    this.name = 'PayError';
    this.code = code;
  }
}
