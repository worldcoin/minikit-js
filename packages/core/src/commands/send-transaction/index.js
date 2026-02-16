import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import {
  Command,
  COMMAND_VERSIONS,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { wagmiSendTransaction } from '../wagmi-fallback';
import { SendTransactionError } from './types';
import { validateSendTransactionPayload } from './validate';
export * from './types';
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
 * console.log(result.executedWith); // 'minikit' | 'wagmi' | 'fallback'
 * ```
 */
export async function sendTransaction(options, ctx) {
  const result = await executeWithFallback({
    command: Command.SendTransaction,
    nativeExecutor: () => nativeSendTransaction(options, ctx),
    wagmiFallback: () => wagmiSendTransactionAdapter(options),
    customFallback: options.fallback,
  });
  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data };
  }
  if (result.executedWith === 'wagmi') {
    return { executedWith: 'wagmi', data: result.data };
  }
  return { executedWith: 'minikit', data: result.data };
}
// ============================================================================
// Native Implementation (World App)
// ============================================================================
async function nativeSendTransaction(options, ctx) {
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
  const input = {
    transaction: options.transaction,
    permit2: options.permit2,
    formatPayload: options.formatPayload !== false,
  };
  const validatedPayload = validateSendTransactionPayload(input);
  const finalPayload = await new Promise((resolve, reject) => {
    try {
      ctx.events.subscribe(ResponseEvent.MiniAppSendTransaction, (response) => {
        ctx.events.unsubscribe(ResponseEvent.MiniAppSendTransaction);
        resolve(response);
      });
      sendMiniKitEvent({
        command: Command.SendTransaction,
        version: COMMAND_VERSIONS[Command.SendTransaction],
        payload: validatedPayload,
      });
    } catch (error) {
      reject(error);
    }
  });
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
async function wagmiSendTransactionAdapter(options) {
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
function encodeTransactionData(tx) {
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
