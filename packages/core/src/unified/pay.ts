/**
 * Unified pay command
 *
 * Works in World App only. Requires custom fallback on web.
 */

import { executeWithFallback } from '../fallback';
import type { CommandResult, FallbackConfig } from '../fallback/types';
import {
  createPayCommand,
  createPayAsyncCommand,
  PayCommandInput,
  MiniAppPaymentPayload,
  TokensPayload,
} from '../../commands/pay';
import { Network, Tokens } from '../../types/payment';
import { EventManager } from '../../core/events';
import { MiniKitState } from '../../core/state';

// ============================================================================
// Types
// ============================================================================

export interface UnifiedPayOptions extends FallbackConfig<PayResult> {
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

// Re-export for convenience
export { Tokens, Network };
export type { TokensPayload };

// ============================================================================
// Implementation
// ============================================================================

/**
 * Send a payment
 *
 * Note: This command only works in World App. On web, you must provide a fallback.
 *
 * @example
 * ```typescript
 * // In World App
 * const result = await pay({
 *   reference: crypto.randomUUID(),
 *   to: '0x...',
 *   tokens: [{ symbol: Tokens.WLD, token_amount: '1.0' }],
 *   description: 'Payment for coffee',
 * });
 *
 * // On web with fallback
 * const result = await pay({
 *   reference: crypto.randomUUID(),
 *   to: '0x...',
 *   tokens: [{ symbol: Tokens.WLD, token_amount: '1.0' }],
 *   description: 'Payment for coffee',
 *   fallback: () => showStripeCheckout(),
 * });
 *
 * console.log(result.via); // 'minikit' | 'fallback'
 * ```
 */
export async function pay(
  options: UnifiedPayOptions
): Promise<CommandResult<PayResult>> {
  return executeWithFallback({
    command: 'pay',
    nativeExecutor: () => nativePay(options),
    // No Wagmi fallback - pay is native only
    customFallback: options.fallback,
    requiresFallback: true, // Must provide fallback on web
  });
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativePay(options: UnifiedPayOptions): Promise<PayResult> {
  const eventManager = new EventManager();
  const stateManager = new MiniKitState();
  const ctx = { events: eventManager, state: stateManager };

  const syncCommand = createPayCommand(ctx);
  const asyncCommand = createPayAsyncCommand(ctx, syncCommand);

  const input: PayCommandInput = {
    reference: options.reference,
    to: options.to,
    tokens: options.tokens,
    description: options.description,
    network: options.network,
  };

  const { finalPayload } = await asyncCommand(input);

  return normalizeNativeResult(finalPayload);
}

function normalizeNativeResult(payload: MiniAppPaymentPayload): PayResult {
  if (payload.status === 'error') {
    throw new PayError(payload.error_code);
  }

  return {
    transactionId: payload.transaction_id,
    reference: payload.reference,
    from: payload.from,
    chain: payload.chain,
    timestamp: payload.timestamp,
  };
}

// ============================================================================
// Errors
// ============================================================================

export class PayError extends Error {
  public readonly code: string;

  constructor(code: string) {
    super(`Payment failed: ${code}`);
    this.name = 'PayError';
    this.code = code;
  }
}
