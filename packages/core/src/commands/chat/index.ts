import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import type { CommandResult } from '../types';
import { executeWithFallback } from '../fallback';
import { EventManager } from '../../events';

export * from './types';
import type {
  MiniKitChatOptions,
  MiniAppChatSuccessPayload,
  MiniAppChatPayload,
} from './types';
import { ChatError } from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function chat<TFallback = MiniAppChatSuccessPayload>(
  options: MiniKitChatOptions<TFallback>,
  ctx?: CommandContext,
): Promise<CommandResult<MiniAppChatSuccessPayload | TFallback>> {
  return executeWithFallback({
    command: Command.Chat,
    nativeExecutor: () => nativeChat(options, ctx),
    customFallback: options.fallback,
  });
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeChat(
  options: MiniKitChatOptions<any>,
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

  const payloadInput = {
    message: options.message,
    to: options.to,
  };

  if (payloadInput.message.length === 0) {
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
        payload: payloadInput,
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
