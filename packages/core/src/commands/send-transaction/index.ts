import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import { getFallbackAdapter } from '../fallback-adapter-registry';
import type { CommandResultByVia } from '../types';
import {
  Command,
  COMMAND_VERSIONS,
  CommandUnavailableError,
  CommandContext,
  isCommandAvailable,
  isInWorldApp,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import type {
  CalldataTransaction,
  MiniAppSendTransactionPayload,
  MiniKitSendTransactionOptions,
  SendTransactionResult,
} from './types';
import { SendTransactionError, SendTransactionErrorCodes } from './types';
import { validateSendTransactionPayload } from './validate';

export * from './types';

const WORLD_CHAIN_ID = 480;
const WAGMI_MULTI_TX_ERROR_MESSAGE =
  'Wagmi fallback does not support multi-transaction execution. Pass a single transaction, run inside World App for batching, or provide a custom fallback.';

type NormalizedSendTransactionOptions = {
  transactions: CalldataTransaction[];
  chainId: number;
};

function resolveChainId(options: MiniKitSendTransactionOptions<any>): number {
  return options.chainId;
}

function resolveTransactions(
  options: MiniKitSendTransactionOptions<any>,
): CalldataTransaction[] {
  if (options.transactions.length === 0) {
    throw new SendTransactionError(SendTransactionErrorCodes.InputError, {
      reason:
        'At least one transaction is required. Use `transactions: [{ to, data, value }]`.',
    });
  }
  return options.transactions;
}

function normalizeSendTransactionOptions(
  options: MiniKitSendTransactionOptions<any>,
): NormalizedSendTransactionOptions {
  const chainId = resolveChainId(options);
  if (chainId !== WORLD_CHAIN_ID) {
    throw new SendTransactionError(SendTransactionErrorCodes.InvalidOperation, {
      reason: `World App only supports World Chain (chainId: ${WORLD_CHAIN_ID})`,
    });
  }

  return {
    transactions: resolveTransactions(options),
    chainId,
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
 *   chainId: 480,
 *   transactions: [{
 *     to: '0x...',
 *     data: '0x...',
 *     value: '0x0',
 *   }],
 * });
 *
 * console.log(result.data.userOpHash); // '0x...'
 * console.log(result.executedWith); // 'minikit' | 'wagmi' | 'fallback'
 * ```
 */
export async function sendTransaction<TFallback = SendTransactionResult>(
  options: MiniKitSendTransactionOptions<TFallback>,
  ctx?: CommandContext,
): Promise<CommandResultByVia<SendTransactionResult, TFallback>> {
  const normalizedOptions = normalizeSendTransactionOptions(options);
  const fallbackAdapter = getFallbackAdapter();
  const isWagmiFallbackPath =
    !isInWorldApp() && Boolean(fallbackAdapter?.sendTransaction);
  if (
    isWagmiFallbackPath &&
    normalizedOptions.transactions.length > 1 &&
    !options.fallback
  ) {
    throw new SendTransactionError(SendTransactionErrorCodes.InvalidOperation, {
      reason: WAGMI_MULTI_TX_ERROR_MESSAGE,
    });
  }

  const result = await executeWithFallback({
    command: Command.SendTransaction,
    nativeExecutor: () => nativeSendTransaction(normalizedOptions, ctx),
    wagmiFallback: fallbackAdapter?.sendTransaction
      ? () => adapterSendTransactionFallback(normalizedOptions)
      : undefined,
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
  options: NormalizedSendTransactionOptions,
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

  if (options.chainId !== WORLD_CHAIN_ID) {
    throw new Error(
      `World App only supports World Chain (chainId: ${WORLD_CHAIN_ID})`,
    );
  }

  const commandInput = window.WorldApp?.supported_commands.find(
    (command) => command.name === Command.SendTransaction,
  );
  if (
    commandInput &&
    !commandInput.supported_versions.includes(
      COMMAND_VERSIONS[Command.SendTransaction],
    )
  ) {
    throw new CommandUnavailableError(
      Command.SendTransaction,
      'oldAppVersion',
    );
  }

  const input = {
    transactions: options.transactions,
    chainId: options.chainId,
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

  const successPayload = finalPayload as Record<string, unknown>;

  return {
    userOpHash: String(successPayload.userOpHash ?? ''),
    status: finalPayload.status,
    version: finalPayload.version,
    from: String(successPayload.from ?? ''),
    timestamp: String(successPayload.timestamp ?? new Date().toISOString()),
  };
}

// ============================================================================
// Wagmi Adapter
// ============================================================================

async function adapterSendTransactionFallback(
  options: NormalizedSendTransactionOptions,
): Promise<SendTransactionResult> {
  if (options.transactions.length > 1) {
    throw new Error(WAGMI_MULTI_TX_ERROR_MESSAGE);
  }

  const firstTransaction = options.transactions[0];
  if (!firstTransaction) {
    throw new Error('At least one transaction is required');
  }

  const fallbackAdapter = getFallbackAdapter();
  if (!fallbackAdapter?.sendTransaction) {
    throw new Error('Fallback adapter is not registered.');
  }

  const result = await fallbackAdapter.sendTransaction({
    transaction: {
      address: firstTransaction.to,
      data: firstTransaction.data,
      value: firstTransaction.value,
    },
    chainId: options.chainId,
  });

  return {
    userOpHash: result.transactionHash,
    status: 'success',
    version: COMMAND_VERSIONS[Command.SendTransaction],
    from: '',
    timestamp: new Date().toISOString(),
  };
}
