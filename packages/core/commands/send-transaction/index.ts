import { validateSendTransactionPayload } from './validate';
import { Network } from '../../types/payment';
import { Permit2, Transaction } from '../../types/transactions';
import {
  AsyncHandlerReturn,
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { executeWithFallback } from '../fallback';
import { wagmiSendTransaction } from '../fallback-wagmi';
import type { CommandResult, FallbackConfig } from '../fallback';
import { EventManager } from '../../events';
import { MiniKitState } from '../../state';

// ============================================================================
// Types
// ============================================================================

export type SendTransactionInput = {
  transaction: Transaction[];
  permit2?: Permit2[];
  formatPayload?: boolean;
};

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
  reference: string;
  from: string;
  chain: Network;
  timestamp: string;
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

// ============================================================================
// Unified API Types
// ============================================================================

export interface UnifiedSendTransactionOptions
  extends FallbackConfig<SendTransactionResult> {
  /** Transactions to execute */
  transaction: Transaction[];

  /** Permit2 data for token approvals (World App only) */
  permit2?: Permit2[];

  /** Whether to format the payload (default: true) */
  formatPayload?: boolean;
}

export interface SendTransactionResult {
  /** Transaction hash(es) */
  hashes: string[];
  /** Transaction ID (World App only) */
  transactionId?: string;
  /** Reference (World App only) */
  reference?: string;
  /** From address */
  from?: string;
  /** Chain identifier */
  chain?: string;
  /** Timestamp */
  timestamp?: string;
}

// Feature support differences between World App and Web
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
  batch: false, // Wagmi executes sequentially
  permit2: false,
  gasSponsorship: false,
};

// ============================================================================
// Native Command Implementation
// ============================================================================

export function createSendTransactionCommand(_ctx: CommandContext) {
  return (payload: SendTransactionInput): SendTransactionPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.SendTransaction)
    ) {
      console.error(
        "'sendTransaction' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    // Default to formatting the payload
    payload.formatPayload = payload.formatPayload !== false;
    const validatedPayload = validateSendTransactionPayload(payload);

    sendMiniKitEvent({
      command: Command.SendTransaction,
      version: COMMAND_VERSIONS[Command.SendTransaction],
      payload: validatedPayload,
    });

    return validatedPayload;
  };
}

export function createSendTransactionAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createSendTransactionCommand>,
) {
  return async (
    payload: SendTransactionInput,
  ): AsyncHandlerReturn<
    SendTransactionPayload | null,
    MiniAppSendTransactionPayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: SendTransactionPayload | null = null;

        const handleResponse = (response: MiniAppSendTransactionPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppSendTransaction);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppSendTransaction,
          handleResponse as any,
        );
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

/**
 * Send one or more transactions
 *
 * @example
 * ```typescript
 * const result = await sendTransaction({
 *   transaction: [{
 *     address: '0x...',
 *     abi: ContractABI,
 *     functionName: 'mint',
 *     args: [],
 *   }],
 * });
 *
 * console.log(result.data.hashes); // ['0x...']
 * console.log(result.via); // 'minikit' | 'wagmi' | 'fallback'
 * ```
 */
export async function sendTransaction(
  options: UnifiedSendTransactionOptions
): Promise<CommandResult<SendTransactionResult>> {
  return executeWithFallback({
    command: 'sendTransaction',
    nativeExecutor: () => nativeSendTransaction(options),
    wagmiFallback: () => wagmiSendTransactionAdapter(options),
    customFallback: options.fallback,
  });
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeSendTransaction(
  options: UnifiedSendTransactionOptions
): Promise<SendTransactionResult> {
  const eventManager = new EventManager();
  const stateManager = new MiniKitState();
  const ctx = { events: eventManager, state: stateManager };

  const syncCommand = createSendTransactionCommand(ctx);
  const asyncCommand = createSendTransactionAsyncCommand(ctx, syncCommand);

  const input: SendTransactionInput = {
    transaction: options.transaction,
    permit2: options.permit2,
    formatPayload: options.formatPayload,
  };

  const { finalPayload } = await asyncCommand(input);

  return normalizeNativeResult(finalPayload);
}

function normalizeNativeResult(
  payload: MiniAppSendTransactionPayload
): SendTransactionResult {
  if (payload.status === 'error') {
    throw new SendTransactionError(payload.error_code, payload.details);
  }

  return {
    hashes: [payload.transaction_id],
    transactionId: payload.transaction_id,
    reference: payload.reference,
    from: payload.from,
    chain: payload.chain,
    timestamp: payload.timestamp,
  };
}

// ============================================================================
// Wagmi Adapter
// ============================================================================

async function wagmiSendTransactionAdapter(
  options: UnifiedSendTransactionOptions
): Promise<SendTransactionResult> {
  // Warn about unsupported features
  if (options.permit2 && options.permit2.length > 0) {
    console.warn(
      'Permit2 is not supported via Wagmi fallback. Transactions will execute without permit2.'
    );
  }

  // Convert Transaction[] to the format wagmiSendTransaction expects
  const transactions = options.transaction.map((tx) => ({
    address: tx.address,
    // Encode the function call data
    data: encodeTransactionData(tx),
    value: tx.value,
  }));

  const result = await wagmiSendTransaction({ transactions });

  return {
    hashes: result.hashes,
  };
}

/**
 * Encode transaction data from ABI + function name + args
 */
function encodeTransactionData(tx: Transaction): string | undefined {
  // For web fallback, we need to encode the function call
  // This requires viem's encodeFunctionData which is available via Wagmi
  // The wagmiSendTransaction will handle this encoding
  try {
    // Dynamic import to avoid bundling viem if not used
    const { encodeFunctionData } = require('viem');
    return encodeFunctionData({
      abi: tx.abi,
      functionName: tx.functionName,
      args: tx.args,
    });
  } catch {
    // If viem is not available, return undefined and let wagmiSendTransaction handle it
    return undefined;
  }
}

// ============================================================================
// Errors
// ============================================================================

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
