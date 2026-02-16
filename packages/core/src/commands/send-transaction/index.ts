import { validateSendTransactionPayload } from './validate';
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
import { wagmiSendTransaction } from '../wagmi-fallback';
import { EventManager } from '../../events';

export * from './types';
import type {
  SendTransactionInput,
  MiniKitSendTransactionOptions,
  SendTransactionResult,
  MiniAppSendTransactionPayload,
  Transaction,
} from './types';
import { SendTransactionError } from './types';

const WORLD_CHAIN_ID = 480;

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

/**
 * Send one or more transactions
 *
 * @example
 * ```typescript
 * const result = await sendTransaction({
 *   chainId: 480,
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
export async function sendTransaction<TFallback = SendTransactionResult>(
  options: MiniKitSendTransactionOptions<TFallback>,
  ctx?: CommandContext,
): Promise<CommandResult<SendTransactionResult | TFallback>> {
  return executeWithFallback({
    command: Command.SendTransaction,
    nativeExecutor: () => nativeSendTransaction(options, ctx),
    wagmiFallback: () => wagmiSendTransactionAdapter(options),
    customFallback: options.fallback,
  });
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeSendTransaction(
  options: MiniKitSendTransactionOptions<any>,
  ctx?: CommandContext,
): Promise<SendTransactionResult> {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }

  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.SendTransaction)
  ) {
    throw new Error(
      "'sendTransaction' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  if (
    options.chainId !== undefined &&
    options.chainId !== WORLD_CHAIN_ID
  ) {
    throw new Error(
      `World App only supports World Chain (chainId: ${WORLD_CHAIN_ID})`,
    );
  }

  const input: SendTransactionInput = {
    transaction: options.transaction,
    permit2: options.permit2,
    formatPayload: options.formatPayload !== false,
  };

  const validatedPayload = validateSendTransactionPayload(input);

  const finalPayload = await new Promise<MiniAppSendTransactionPayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(
          ResponseEvent.MiniAppSendTransaction,
          ((response: MiniAppSendTransactionPayload) => {
            ctx!.events.unsubscribe(ResponseEvent.MiniAppSendTransaction);
            resolve(response);
          }) as any,
        );

        sendMiniKitEvent({
          command: Command.SendTransaction,
          version: COMMAND_VERSIONS[Command.SendTransaction],
          payload: validatedPayload,
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (finalPayload.status === 'error') {
    throw new SendTransactionError(
      finalPayload.error_code,
      finalPayload.details,
    );
  }

  return {
    hashes: [finalPayload.transaction_id],
    transactionId: finalPayload.transaction_id,
    reference: finalPayload.reference,
    from: finalPayload.from,
    chain: finalPayload.chain,
    timestamp: finalPayload.timestamp,

    // Deprecated aliases
    transaction_id: finalPayload.transaction_id,
    transaction_status: 'submitted',
  };
}

// ============================================================================
// Wagmi Adapter
// ============================================================================

async function wagmiSendTransactionAdapter(
  options: MiniKitSendTransactionOptions<any>,
): Promise<SendTransactionResult> {
  // Warn about unsupported features
  if (options.permit2 && options.permit2.length > 0) {
    console.warn(
      'Permit2 is not supported via Wagmi fallback. Transactions will execute without permit2.',
    );
  }

  // Convert Transaction[] to the format wagmiSendTransaction expects
  const transactions = options.transaction.map((tx) => ({
    address: tx.address,
    // Encode the function call data
    data: encodeTransactionData(tx),
    value: tx.value,
  }));

  const result = await wagmiSendTransaction({
    transactions,
    chainId: options.chainId,
  });

  return {
    hashes: result.hashes,
  };
}

/**
 * Encode transaction data from ABI + function name + args
 */
function encodeTransactionData(tx: Transaction): string | undefined {
  try {
    const { encodeFunctionData } = require('viem');
    return encodeFunctionData({
      abi: tx.abi,
      functionName: tx.functionName,
      args: tx.args,
    });
  } catch {
    return undefined;
  }
}
