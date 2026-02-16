import { encodeFunctionData } from 'viem';
import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import type { CommandResultByVia } from '../types';
import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  isInWorldApp,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { hasWagmiConfig, wagmiSendTransaction } from '../wagmi-fallback';
import type {
  MiniAppSendTransactionPayload,
  MiniKitSendTransactionOptions,
  SendTransactionResult,
  Transaction,
} from './types';
import { SendTransactionError, SendTransactionErrorCodes } from './types';
import { validateSendTransactionPayload } from './validate';

export * from './types';

const WORLD_CHAIN_ID = 480;
const WAGMI_MULTI_TX_ERROR_MESSAGE =
  'Wagmi fallback does not support multi-transaction execution. Pass a single transaction, run inside World App for batching, or provide a custom fallback.';

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
 * console.log(result.data.transactionHash); // '0x...'
 * console.log(result.executedWith); // 'minikit' | 'wagmi' | 'fallback'
 * ```
 */
export async function sendTransaction<TFallback = SendTransactionResult>(
  options: MiniKitSendTransactionOptions<TFallback>,
  ctx?: CommandContext,
): Promise<CommandResultByVia<SendTransactionResult, TFallback>> {
  const isWagmiFallbackPath = !isInWorldApp() && hasWagmiConfig();
  if (
    isWagmiFallbackPath &&
    options.transaction.length > 1 &&
    !options.fallback
  ) {
    throw new SendTransactionError(SendTransactionErrorCodes.InvalidOperation, {
      reason: WAGMI_MULTI_TX_ERROR_MESSAGE,
    });
  }

  const result = await executeWithFallback({
    command: Command.SendTransaction,
    nativeExecutor: () => nativeSendTransaction(options, ctx),
    wagmiFallback: () => wagmiSendTransactionAdapter(options),
    customFallback: options.fallback,
  });

  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data as TFallback };
  }

  if (result.executedWith === 'wagmi') {
    return {
      executedWith: 'wagmi',
      data: result.data as SendTransactionResult,
    };
  }

  return {
    executedWith: 'minikit',
    data: result.data as SendTransactionResult,
  };
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

  if (options.chainId !== undefined && options.chainId !== WORLD_CHAIN_ID) {
    throw new Error(
      `World App only supports World Chain (chainId: ${WORLD_CHAIN_ID})`,
    );
  }

  const input: MiniKitSendTransactionOptions = {
    transaction: options.transaction,
    permit2: options.permit2,
    formatPayload: options.formatPayload !== false,
  };

  const validatedPayload = validateSendTransactionPayload(input);

  const finalPayload = await new Promise<MiniAppSendTransactionPayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(ResponseEvent.MiniAppSendTransaction, ((
          response: MiniAppSendTransactionPayload,
        ) => {
          ctx!.events.unsubscribe(ResponseEvent.MiniAppSendTransaction);
          resolve(response);
        }) as any);

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
    transactionHash: null,
    userOpHash: finalPayload.userOpHash ?? null,
    mini_app_id: finalPayload.mini_app_id ?? null,
    status: finalPayload.status,
    version: finalPayload.version,
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
  if (options.transaction.length > 1) {
    throw new Error(WAGMI_MULTI_TX_ERROR_MESSAGE);
  }

  // Warn about unsupported features
  if (options.permit2 && options.permit2.length > 0) {
    console.warn(
      'Permit2 signature is not automatically supported via Wagmi fallback. Transactions will execute without permit2.',
    );
  }

  // Convert Transaction[] to the format wagmiSendTransaction expects
  const transactions = options.transaction.map((tx) => ({
    address: tx.address,
    // Encode the function call data
    data: encodeTransactionData(tx),
    value: tx.value,
  }));
  const firstTransaction = transactions[0];
  if (!firstTransaction) {
    throw new Error('At least one transaction is required');
  }

  const result = await wagmiSendTransaction({
    transaction: firstTransaction,
    chainId: options.chainId,
  });

  return {
    transactionHash: result.transactionHash,
    userOpHash: null,
    mini_app_id: null,
    status: 'success',
    version: 1,
    transactionId: null,
    reference: null,
    from: null,
    chain: null,
    timestamp: null,
  };
}

/**
 * Encode transaction data from ABI + function name + args
 */
function encodeTransactionData(tx: Transaction): string | undefined {
  if (tx.data) return tx.data;

  return encodeFunctionData({
    abi: tx.abi,
    functionName: tx.functionName,
    args: tx.args,
  });
}
