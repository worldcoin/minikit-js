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
} from '../types';

// ============================================================================
// Types
// ============================================================================

export type ChatPayload = {
  to?: string[];
  message: string;
};

export enum ChatErrorCodes {
  UserRejected = 'user_rejected',
  SendFailed = 'send_failed',
  GenericError = 'generic_error',
}

export const ChatErrorMessage = {
  [ChatErrorCodes.UserRejected]: 'User rejected the request.',
  [ChatErrorCodes.SendFailed]: 'Failed to send the message.',
  [ChatErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export type MiniAppChatSuccessPayload = MiniAppBaseSuccessPayload & {
  count: number;
  timestamp: string;
};

export type MiniAppChatErrorPayload = MiniAppBaseErrorPayload<ChatErrorCodes>;

export type MiniAppChatPayload =
  | MiniAppChatSuccessPayload
  | MiniAppChatErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createChatCommand(_ctx: CommandContext) {
  return (payload: ChatPayload): ChatPayload | null => {
    if (typeof window === 'undefined' || !isCommandAvailable(Command.Chat)) {
      console.error(
        "'chat' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    if (payload.message.length === 0) {
      console.error("'chat' command requires a non-empty message");
      return null;
    }

    sendMiniKitEvent({
      command: Command.Chat,
      version: COMMAND_VERSIONS[Command.Chat],
      payload,
    });

    return payload;
  };
}

export function createChatAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createChatCommand>,
) {
  return async (
    payload: ChatPayload,
  ): AsyncHandlerReturn<ChatPayload | null, MiniAppChatPayload> => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: ChatPayload | null = null;

        const handleResponse = (response: MiniAppChatPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppChat);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(ResponseEvent.MiniAppChat, handleResponse as any);
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
