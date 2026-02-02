import { validateSendTransactionPayload } from '../helpers/transaction/validate-payload';
import { Network } from '../types/payment';
import { Permit2, Transaction } from '../types/transactions';
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
} from './types';

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
// Implementation
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
