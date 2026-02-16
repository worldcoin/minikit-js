import { validatePaymentPayload } from './validate';
import { Network } from './types';
import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import type { CommandResult } from '../types';
import { executeWithFallback } from '../fallback';
import { EventManager } from '../../events';

export * from './types';
import type {
  PayCommandInput,
  PayCommandPayload,
  PayOptions,
  PayResult,
  MiniAppPaymentPayload,
} from './types';
import { PayError } from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

/**
 * Send a payment
 *
 * Note: This command works natively in World App. On web, provide a fallback if needed.
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
  options: PayOptions,
  ctx?: CommandContext,
): Promise<CommandResult<PayResult>> {
  return executeWithFallback({
    command: Command.Pay,
    nativeExecutor: () => nativePay(options, ctx),
    // No Wagmi fallback - pay is native only
    customFallback: options.fallback,
  });
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativePay(
  options: PayOptions,
  ctx?: CommandContext,
): Promise<PayResult> {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }

  if (typeof window === 'undefined' || !isCommandAvailable(Command.Pay)) {
    throw new Error(
      "'pay' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  const input: PayCommandInput = {
    reference: options.reference,
    to: options.to,
    tokens: options.tokens,
    description: options.description,
    network: options.network,
  };

  if (!validatePaymentPayload(input)) {
    throw new Error('Invalid payment payload');
  }

  const eventPayload: PayCommandPayload = {
    ...input,
    network: Network.WorldChain,
  };

  const finalPayload = await new Promise<MiniAppPaymentPayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(
          ResponseEvent.MiniAppPayment,
          ((response: MiniAppPaymentPayload) => {
            ctx!.events.unsubscribe(ResponseEvent.MiniAppPayment);
            resolve(response);
          }) as any,
        );

        sendMiniKitEvent({
          command: Command.Pay,
          version: COMMAND_VERSIONS[Command.Pay],
          payload: eventPayload,
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (finalPayload.status === 'error') {
    throw new PayError(finalPayload.error_code);
  }

  return {
    transactionId: finalPayload.transaction_id,
    reference: finalPayload.reference,
    from: finalPayload.from,
    chain: finalPayload.chain,
    timestamp: finalPayload.timestamp,
  };
}
