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

export type SignMessageInput = {
  message: string;
};

export type SignMessagePayload = SignMessageInput;

export enum SignMessageErrorCodes {
  InvalidMessage = 'invalid_message',
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export const SignMessageErrorMessage = {
  [SignMessageErrorCodes.InvalidMessage]: 'Invalid message requested',
  [SignMessageErrorCodes.UserRejected]: 'User rejected the request.',
  [SignMessageErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export type MiniAppSignMessageSuccessPayload = MiniAppBaseSuccessPayload & {
  signature: string;
  address: string;
};

export type MiniAppSignMessageErrorPayload =
  MiniAppBaseErrorPayload<SignMessageErrorCodes> & {
    details?: Record<string, any>;
  };

export type MiniAppSignMessagePayload =
  | MiniAppSignMessageSuccessPayload
  | MiniAppSignMessageErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createSignMessageCommand(_ctx: CommandContext) {
  return (payload: SignMessageInput): SignMessagePayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.SignMessage)
    ) {
      console.error(
        "'signMessage' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    sendMiniKitEvent({
      command: Command.SignMessage,
      version: COMMAND_VERSIONS[Command.SignMessage],
      payload,
    });

    return payload;
  };
}

export function createSignMessageAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createSignMessageCommand>,
) {
  return async (
    payload: SignMessageInput,
  ): AsyncHandlerReturn<
    SignMessagePayload | null,
    MiniAppSignMessagePayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: SignMessagePayload | null = null;

        const handleResponse = (response: MiniAppSignMessagePayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppSignMessage);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppSignMessage,
          handleResponse as any,
        );
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
