/**
 * Unified send transaction command
 *
 * Works in both World App (native with batch + permit2 + gas sponsorship)
 * and web (Wagmi fallback with sequential execution).
 */

import { executeWithFallback } from '../fallback';
import { wagmiSendTransaction } from '../fallback/wagmi';
import type { CommandResult, FallbackConfig } from '../fallback/types';
import {
  createSendTransactionCommand,
  createSendTransactionAsyncCommand,
  SendTransactionInput,
  MiniAppSendTransactionPayload,
} from '../../commands/send-transaction';
import { Transaction, Permit2 } from '../../types/transactions';
import { EventManager } from '../../core/events';
import { MiniKitState } from '../../core/state';

// ============================================================================
// Types
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
// Implementation
// ============================================================================

/**
 * Send one or more transactions
 *
 * @example
 * ```typescript
 * // Single transaction
 * const result = await sendTransaction({
 *   transaction: [{
 *     address: '0x...',
 *     abi: ContractABI,
 *     functionName: 'mint',
 *     args: [],
 *   }],
 * });
 *
 * // Multiple transactions (batched in World App, sequential on web)
 * const result = await sendTransaction({
 *   transaction: [
 *     { address: '0x...', abi, functionName: 'approve', args: [...] },
 *     { address: '0x...', abi, functionName: 'mint', args: [...] },
 *   ],
 * });
 *
 * console.log(result.data.hashes); // ['0x...', '0x...']
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
