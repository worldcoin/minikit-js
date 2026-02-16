import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import {
  Command,
  COMMAND_VERSIONS,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { ChatError } from './types';
export * from './types';
// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================
export async function chat(options, ctx) {
  const result = await executeWithFallback({
    command: Command.Chat,
    nativeExecutor: () => nativeChat(options, ctx),
    customFallback: options.fallback,
  });
  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data };
  }
  return { executedWith: 'minikit', data: result.data };
}
// ============================================================================
// Native Implementation (World App)
// ============================================================================
async function nativeChat(options, ctx) {
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
  const payload = await new Promise((resolve, reject) => {
    try {
      ctx.events.subscribe(ResponseEvent.MiniAppChat, (response) => {
        ctx.events.unsubscribe(ResponseEvent.MiniAppChat);
        resolve(response);
      });
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
