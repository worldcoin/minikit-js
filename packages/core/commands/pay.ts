import { validatePaymentPayload } from '../helpers/payment/client';
import { Network, Tokens } from '../types/payment';
import {
  Command,
  CommandContext,
  COMMAND_VERSIONS,
  isCommandAvailable,
  sendMiniKitEvent,
  ResponseEvent,
  AsyncHandlerReturn,
} from './types';

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
  [PaymentErrorCodes.UserRejected]: 'You have cancelled the payment in World App.',
  [PaymentErrorCodes.PaymentRejected]: "You've cancelled the payment in World App.",
  [PaymentErrorCodes.InvalidReceiver]:
    'The receiver address is invalid. Please contact the app owner.',
  [PaymentErrorCodes.InsufficientBalance]:
    'You do not have enough balance to complete this transaction.',
  [PaymentErrorCodes.TransactionFailed]: 'The transaction failed. Please try again.',
  [PaymentErrorCodes.GenericError]: 'Something unexpected went wrong. Please try again.',
  [PaymentErrorCodes.UserBlocked]: "User's region is blocked from making payments.",
};

export type MiniAppPaymentSuccessPayload = {
  status: 'success';
  transaction_status: 'submitted';
  transaction_id: string;
  reference: string;
  from: string;
  chain: Network;
  timestamp: string;
  version: number;
};

export type MiniAppPaymentErrorPayload = {
  status: 'error';
  error_code: PaymentErrorCodes;
  version: number;
};

export type MiniAppPaymentPayload =
  | MiniAppPaymentSuccessPayload
  | MiniAppPaymentErrorPayload;

// ============================================================================
// Implementation
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

        ctx.events.subscribe(ResponseEvent.MiniAppPayment, handleResponse as any);
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
