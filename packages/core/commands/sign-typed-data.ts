import type { TypedData, TypedDataDomain } from 'abitype';
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

export type SignTypedDataInput = {
  types: TypedData;
  primaryType: string;
  message: Record<string, unknown>;
  domain?: TypedDataDomain;
  chainId?: number;
};

export type SignTypedDataPayload = SignTypedDataInput;

export enum SignTypedDataErrorCodes {
  InvalidOperation = 'invalid_operation',
  UserRejected = 'user_rejected',
  InputError = 'input_error',
  SimulationFailed = 'simulation_failed',
  GenericError = 'generic_error',
  DisallowedOperation = 'disallowed_operation',
  InvalidContract = 'invalid_contract',
  MaliciousOperation = 'malicious_operation',
}

export const SignTypedDataErrorMessage = {
  [SignTypedDataErrorCodes.InvalidOperation]:
    'Transaction included an operation that was invalid',
  [SignTypedDataErrorCodes.UserRejected]: 'User rejected the request.',
  [SignTypedDataErrorCodes.InputError]: 'Invalid payload.',
  [SignTypedDataErrorCodes.SimulationFailed]:
    'The transaction simulation failed.',
  [SignTypedDataErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
  [SignTypedDataErrorCodes.DisallowedOperation]:
    'The operation requested is not allowed. Please refer to the docs.',
  [SignTypedDataErrorCodes.InvalidContract]:
    'The contract address is not allowed for your application. Please check your developer portal configurations',
  [SignTypedDataErrorCodes.MaliciousOperation]:
    'The operation requested is considered malicious.',
};

export type MiniAppSignTypedDataSuccessPayload = MiniAppBaseSuccessPayload & {
  signature: string;
  address: string;
};

export type MiniAppSignTypedDataErrorPayload =
  MiniAppBaseErrorPayload<SignTypedDataErrorCodes> & {
    details?: Record<string, any>;
  };

export type MiniAppSignTypedDataPayload =
  | MiniAppSignTypedDataSuccessPayload
  | MiniAppSignTypedDataErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createSignTypedDataCommand(_ctx: CommandContext) {
  return (payload: SignTypedDataInput): SignTypedDataPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.SignTypedData)
    ) {
      console.error(
        "'signTypedData' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    // If no chainId is provided, use Worldchain
    if (!payload.chainId) {
      payload.chainId = 480;
    }

    sendMiniKitEvent({
      command: Command.SignTypedData,
      version: COMMAND_VERSIONS[Command.SignTypedData],
      payload,
    });

    return payload;
  };
}

export function createSignTypedDataAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createSignTypedDataCommand>,
) {
  return async (
    payload: SignTypedDataInput,
  ): AsyncHandlerReturn<
    SignTypedDataPayload | null,
    MiniAppSignTypedDataPayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: SignTypedDataPayload | null = null;

        const handleResponse = (response: MiniAppSignTypedDataPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppSignTypedData);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppSignTypedData,
          handleResponse as any,
        );
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
