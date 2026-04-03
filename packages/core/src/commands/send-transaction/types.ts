import type {
  Abi,
  AbiParametersToPrimitiveTypes,
  AbiStateMutability,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
} from 'abitype';
import { Network } from '../pay/types';
import type {
  FallbackConfig,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

// ============================================================================
// Transaction Types (moved from types/transactions.ts)
// ============================================================================

export type Permit2 = {
  permitted: {
    token: string;
    amount: string | unknown;
  };
  spender: string;
  nonce: string | unknown;
  deadline: string | unknown;
};

export type CalldataTransaction = {
  to: string;
  /** Raw calldata hex string */
  data?: string;
  /** Hex encoded value */
  value?: string | undefined;
};

/** @deprecated Use {@link CalldataTransaction} in `transactions` */
export type LegacyTransaction = {
  address: string;
  value?: string | undefined;
  /** Raw calldata. If provided, it takes precedence over ABI/functionName/args. */
  data?: string;
  abi?: Abi | readonly unknown[];
  functionName?: ContractFunctionName<
    Abi | readonly unknown[],
    'payable' | 'nonpayable'
  >;
  args?: ContractFunctionArgs<
    Abi | readonly unknown[],
    'payable' | 'nonpayable',
    ContractFunctionName<Abi | readonly unknown[], 'payable' | 'nonpayable'>
  >;
};

export type ContractFunctionName<
  abi extends Abi | readonly unknown[] = Abi,
  mutability extends AbiStateMutability = AbiStateMutability,
> =
  ExtractAbiFunctionNames<
    abi extends Abi ? abi : Abi,
    mutability
  > extends infer functionName extends string
    ? [functionName] extends [never]
      ? string
      : functionName
    : string;

export type ContractFunctionArgs<
  abi extends Abi | readonly unknown[] = Abi,
  mutability extends AbiStateMutability = AbiStateMutability,
  functionName extends ContractFunctionName<
    abi,
    mutability
  > = ContractFunctionName<abi, mutability>,
> =
  AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<
      abi extends Abi ? abi : Abi,
      functionName,
      mutability
    >['inputs'],
    'inputs'
  > extends infer args
    ? [args] extends [never]
      ? readonly unknown[]
      : args
    : readonly unknown[];

/** @deprecated Use {@link CalldataTransaction} */
export type Transaction = LegacyTransaction;

// ============================================================================
// Send Transaction Types
// ============================================================================

/** @deprecated sendTransaction v1 payload (legacy) */
export type SendTransactionV1Input = {
  transactions: CalldataTransaction[];
  network: Network;
  permit2?: Permit2[];
  formatPayload?: boolean;
};

/** @deprecated sendTransaction v1 payload (legacy) */
export type SendTransactionV1Payload = SendTransactionV1Input;

/** sendTransaction v2 payload sent to mobile */
export type SendTransactionV2Input = {
  transactions: CalldataTransaction[];
  chainId: number;
};

export type SendTransactionV2Payload = SendTransactionV2Input;

/** Current sendTransaction payload */
export type SendTransactionInput = SendTransactionV2Input;
export type SendTransactionPayload = SendTransactionV2Payload;

export enum SendTransactionErrorCodes {
  InvalidOperation = 'invalid_operation',
  UserRejected = 'user_rejected',
  InputError = 'input_error',
  SimulationFailed = 'simulation_failed',
  TransactionFailed = 'transaction_failed',
  GenericError = 'generic_error',
  DisallowedOperation = 'disallowed_operation',
  ValidationError = 'validation_error',
  InvalidContract = 'invalid_contract',
  MaliciousOperation = 'malicious_operation',
  DailyTxLimitReached = 'daily_tx_limit_reached',
  PermittedAmountExceedsSlippage = 'permitted_amount_exceeds_slippage',
  PermittedAmountNotFound = 'permitted_amount_not_found',
}

export const SendTransactionErrorMessage: Record<
  SendTransactionErrorCodes,
  string
> = {
  [SendTransactionErrorCodes.InvalidOperation]:
    'Transaction included an operation that was invalid',
  [SendTransactionErrorCodes.UserRejected]: 'User rejected the request.',
  [SendTransactionErrorCodes.InputError]: 'Invalid payload.',
  [SendTransactionErrorCodes.SimulationFailed]:
    'The transaction simulation failed.',
  [SendTransactionErrorCodes.ValidationError]:
    'The transaction validation failed. Please try again.',
  [SendTransactionErrorCodes.TransactionFailed]:
    'The transaction failed. Please try again later.',
  [SendTransactionErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
  [SendTransactionErrorCodes.DisallowedOperation]:
    'The operation requested is not allowed. Please refer to the docs.',
  [SendTransactionErrorCodes.InvalidContract]:
    'The contract address is not allowed for your application. Please check your developer portal configurations',
  [SendTransactionErrorCodes.MaliciousOperation]:
    'The operation requested is considered malicious.',
  [SendTransactionErrorCodes.DailyTxLimitReached]:
    'Daily transaction limit reached. Max 100 transactions per day. Wait until the next day.',
  [SendTransactionErrorCodes.PermittedAmountExceedsSlippage]:
    'Permitted amount exceeds slippage. You must spend at least 90% of the permitted amount.',
  [SendTransactionErrorCodes.PermittedAmountNotFound]:
    'Permitted amount not found in permit2 payload.',
};

/** @deprecated sendTransaction v1 success payload */
export type MiniAppSendTransactionV1SuccessPayload =
  MiniAppBaseSuccessPayload & {
    transaction_status: 'submitted';
    transaction_id?: string;
    reference?: string;
    from?: string;
    chain: Network;
    timestamp?: string;
    userOpHash?: string;
    mini_app_id?: string;
  };

/** sendTransaction v2 success payload */
export type MiniAppSendTransactionV2SuccessPayload =
  MiniAppBaseSuccessPayload & {
    userOpHash: string;
    from: string;
    network: Network;
    timestamp: string;
  };

export type MiniAppSendTransactionSuccessPayload =
  MiniAppSendTransactionV2SuccessPayload;

/** @deprecated sendTransaction v1 error payload */
export type MiniAppSendTransactionV1ErrorPayload =
  MiniAppBaseErrorPayload<SendTransactionErrorCodes> & {
    details?: Record<string, any>;
    mini_app_id?: string;
  };

/** sendTransaction v2 error payload */
export type MiniAppSendTransactionV2ErrorPayload =
  MiniAppBaseErrorPayload<SendTransactionErrorCodes> & {
    details?: Record<string, any>;
  };

export type MiniAppSendTransactionErrorPayload =
  MiniAppSendTransactionV2ErrorPayload;

/** @deprecated sendTransaction v1 payload */
export type MiniAppSendTransactionV1Payload =
  | MiniAppSendTransactionV1SuccessPayload
  | MiniAppSendTransactionV1ErrorPayload;

/** sendTransaction v2 payload */
export type MiniAppSendTransactionV2Payload =
  | MiniAppSendTransactionV2SuccessPayload
  | MiniAppSendTransactionV2ErrorPayload;

export type MiniAppSendTransactionPayload = MiniAppSendTransactionV2Payload;

export interface MiniKitSendTransactionOptions<
  TCustomFallback = SendTransactionResult,
> extends FallbackConfig<TCustomFallback> {
  /** Transactions to execute (calldata first) */
  transactions: CalldataTransaction[];

  /** Chain ID to execute on */
  chainId: number;
}

/** @deprecated sendTransaction v1 options (legacy) */
export interface MiniKitSendTransactionV1Options<
  TCustomFallback = SendTransactionResult,
> extends FallbackConfig<TCustomFallback> {
  transactions?: CalldataTransaction[];
  transaction?: LegacyTransaction[];
  network?: Network;
  chainId?: number;
  permit2?: Permit2[];
  formatPayload?: boolean;
}

/** sendTransaction v2 options */
export type MiniKitSendTransactionV2Options<
  TCustomFallback = SendTransactionResult,
> = MiniKitSendTransactionOptions<TCustomFallback>;

/** @deprecated sendTransaction v1 result shape */
export interface SendTransactionV1Result {
  transactionHash?: string | null;
  userOpHash?: string | null;
  mini_app_id?: string | null;
  status?: 'success' | null;
  version?: number | null;
  transactionId?: string | null;
  reference?: string | null;
  from?: string | null;
  chain?: string | null;
  timestamp?: string | null;
  transaction_id?: string | null;
  transaction_status?: 'submitted';
}

/** sendTransaction v2 result shape */
export interface SendTransactionV2Result {
  /** User operation hash (or tx hash in web fallback) */
  userOpHash: string;
  /** Result status */
  status: 'success';
  /** Payload version */
  version: number;
  /** From address */
  from: string;
  /** Timestamp */
  timestamp: string;
}

export type SendTransactionResult = SendTransactionV2Result;

export interface FeatureSupport {
  /** Whether batch transactions are supported */
  batch: boolean;
  /** Whether Permit2 is supported */
  permit2: boolean;
  /** Whether gas sponsorship is available */
  gasSponsorship: boolean;
}

export const WORLD_APP_FEATURES: FeatureSupport = {
  batch: true,
  permit2: true,
  gasSponsorship: true,
};

export const WEB_FEATURES: FeatureSupport = {
  batch: true,
  permit2: false,
  gasSponsorship: false,
};

export class SendTransactionError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, details?: Record<string, unknown>) {
    super(`Transaction failed: ${code}`);
    this.name = 'SendTransactionError';
    this.code = code;
    this.details = details;
  }
}
