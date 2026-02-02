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

export type SendHapticFeedbackInput =
  | {
      hapticsType: 'notification';
      style: 'error' | 'success' | 'warning';
    }
  | {
      hapticsType: 'selection-changed';
      style?: never;
    }
  | {
      hapticsType: 'impact';
      style: 'light' | 'medium' | 'heavy';
    };

export type SendHapticFeedbackPayload = SendHapticFeedbackInput;

export enum SendHapticFeedbackErrorCodes {
  GenericError = 'generic_error',
  UserRejected = 'user_rejected',
}

export const SendHapticFeedbackErrorMessage = {
  [SendHapticFeedbackErrorCodes.GenericError]:
    'Something unexpected went wrong.',
  [SendHapticFeedbackErrorCodes.UserRejected]: 'User rejected the request.',
};

export type MiniAppSendHapticFeedbackSuccessPayload =
  MiniAppBaseSuccessPayload & {
    timestamp: string;
  };

export type MiniAppSendHapticFeedbackErrorPayload =
  MiniAppBaseErrorPayload<SendHapticFeedbackErrorCodes>;

export type MiniAppSendHapticFeedbackPayload =
  | MiniAppSendHapticFeedbackSuccessPayload
  | MiniAppSendHapticFeedbackErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createSendHapticFeedbackCommand(_ctx: CommandContext) {
  return (
    payload: SendHapticFeedbackInput,
  ): SendHapticFeedbackPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.SendHapticFeedback)
    ) {
      console.error(
        "'sendHapticFeedback' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    sendMiniKitEvent({
      command: Command.SendHapticFeedback,
      version: COMMAND_VERSIONS[Command.SendHapticFeedback],
      payload,
    });

    return payload;
  };
}

export function createSendHapticFeedbackAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createSendHapticFeedbackCommand>,
) {
  return async (
    payload: SendHapticFeedbackInput,
  ): AsyncHandlerReturn<
    SendHapticFeedbackPayload | null,
    MiniAppSendHapticFeedbackPayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: SendHapticFeedbackPayload | null = null;

        const handleResponse = (response: MiniAppSendHapticFeedbackPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppSendHapticFeedback);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppSendHapticFeedback,
          handleResponse as any,
        );
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
