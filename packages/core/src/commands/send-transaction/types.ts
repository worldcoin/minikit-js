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

/** @deprecated Use {@link MiniKitSendTransactionOptions} instead */
export type SendTransactionInput = {
  transactions: CalldataTransaction[];
  network: Network;
  permit2?: Permit2[];
  formatPayload?: boolean;
};

/** @deprecated Use {@link MiniKitSendTransactionOptions} instead */
export type SendTransactionPayload = SendTransactionInput;

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

export type MiniAppSendTransactionSuccessPayload = MiniAppBaseSuccessPayload & {
  transaction_status: 'submitted';
  transaction_id: string;
  reference?: string;
  from: string;
  chain: Network;
  timestamp: string;
  userOpHash?: string;
  mini_app_id?: string;
};

export type MiniAppSendTransactionErrorPayload =
  MiniAppBaseErrorPayload<SendTransactionErrorCodes> & {
    details?: Record<string, any>;
    mini_app_id?: string;
  };

export type MiniAppSendTransactionPayload =
  | MiniAppSendTransactionSuccessPayload
  | MiniAppSendTransactionErrorPayload;

export interface MiniKitSendTransactionOptions<
  TCustomFallback = SendTransactionResult,
> extends FallbackConfig<TCustomFallback> {
  /** Transactions to execute (calldata first) */
  transactions?: CalldataTransaction[];

  /** Network to execute on (defaults to World Chain) */
  network?: Network;

  /** Permit2 data for token approvals (World App only) */
  permit2?: Permit2[];

  /** Whether to format the payload (default: true) */
  formatPayload?: boolean;

  /** @deprecated Use `transactions` with `{ to, data, value }` */
  transaction?: LegacyTransaction[];

  /** @deprecated Use `network` */
  chainId?: number;
}



export interface SendTransactionResult {
  /** On-chain transaction hash (Wagmi fallback) */
  transactionHash?: string | null;
  /** User operation hash (World App only) */
  userOpHash?: string | null;
  /** Mini App ID (World App only) */
  mini_app_id?: string | null;
  /** Result status */
  status?: 'success' | null;
  /** Payload version */
  version?: number | null;
  /** Transaction ID (World App only) */
  transactionId?: string | null;
  /** Reference (World App only) */
  reference?: string | null;
  /** From address */
  from?: string | null;
  /** Chain identifier */
  chain?: string | null;
  /** Timestamp */
  timestamp?: string | null;

  // ---- Deprecated aliases (old event payload field names) ----

  /** @deprecated Use `transactionId` instead */
  transaction_id?: string | null;
  /** @deprecated Success is implicit (errors throw). Always `'submitted'` when present. */
  transaction_status?: 'submitted';
}

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
  batch: false,
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
