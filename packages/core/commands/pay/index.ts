import { validatePaymentPayload } from '../../helpers/payment';
import { Network, Tokens } from '../../types/payment';
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
import type { CommandResult, FallbackConfig } from '../fallback';
import { EventManager } from '../../events';
import { MiniKitState } from '../../state';

// ============================================================================
// Types
// ============================================================================

export type TokensPayload = {
  symbol: Tokens;
  token_amount: string;
};

export type PayCommandInput = {
  reference: string;
  to: `0x${string}` | string;
  tokens: TokensPayload[];
  network?: Network;
  description: string;
};

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

// ============================================================================
// Unified API Types
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

// ============================================================================
// Native Command Implementation
// ============================================================================

export function createPayCommand(_ctx: CommandContext) {
  return (payload: PayCommandInput): PayCommandPayload | null => {
    if (typeof window === 'undefined' || !isCommandAvailable(Command.Pay)) {
      console.error(
        "'pay' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    if (!validatePaymentPayload(payload)) {
      return null;
    }

    const eventPayload: PayCommandPayload = {
      ...payload,
      network: Network.WorldChain,
    };

    sendMiniKitEvent({
      command: Command.Pay,
      version: COMMAND_VERSIONS[Command.Pay],
      payload: eventPayload,
    });

    return eventPayload;
  };
}

export function createPayAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createPayCommand>,
) {
  return async (
    payload: PayCommandInput,
  ): AsyncHandlerReturn<PayCommandPayload | null, MiniAppPaymentPayload> => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: PayCommandPayload | null = null;

        const handleResponse = (response: MiniAppPaymentPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppPayment);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppPayment,
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
 * Send a payment
 *
 * Note: This command only works in World App. On web, you must provide a fallback.
 *
 * @example
 * ```typescript
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

  return normalizeNativePayResult(finalPayload);
}

function normalizeNativePayResult(payload: MiniAppPaymentPayload): PayResult {
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
