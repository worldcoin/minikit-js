import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { EventManager } from '../../events';

export * from './types';
import type {
  ChatInput,
  MiniAppChatPayload,
  MiniAppChatSuccessPayload,
} from './types';
import { ChatError } from './types';

// ============================================================================
// Implementation
// ============================================================================

export async function chat(
  input: ChatInput,
  ctx?: CommandContext,
): Promise<MiniAppChatSuccessPayload> {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }

  if (typeof window === 'undefined' || !isCommandAvailable(Command.Chat)) {
    throw new Error(
      "'chat' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  if (input.message.length === 0) {
    throw new Error("'chat' command requires a non-empty message");
  }

  const payload = await new Promise<MiniAppChatPayload>((resolve, reject) => {
    try {
      ctx!.events.subscribe(
        ResponseEvent.MiniAppChat,
        ((response: MiniAppChatPayload) => {
          ctx!.events.unsubscribe(ResponseEvent.MiniAppChat);
          resolve(response);
        }) as any,
      );

      sendMiniKitEvent({
        command: Command.Chat,
        version: COMMAND_VERSIONS[Command.Chat],
        payload: input,
      });
    } catch (error) {
      reject(error);
    }
  });

  if (payload.status === 'error') {
    throw new ChatError(payload.error_code);
  }

  return payload;
}
