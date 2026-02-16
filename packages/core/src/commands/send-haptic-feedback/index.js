import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import {
  Command,
  COMMAND_VERSIONS,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { SendHapticFeedbackError } from './types';
export * from './types';
// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================
export async function sendHapticFeedback(options, ctx) {
  const result = await executeWithFallback({
    command: Command.SendHapticFeedback,
    nativeExecutor: () => nativeSendHapticFeedback(options, ctx),
    customFallback: options.fallback,
  });
  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data };
  }
  return {
    executedWith: 'minikit',
    data: result.data,
  };
}
// ============================================================================
// Native Implementation (World App)
// ============================================================================
async function nativeSendHapticFeedback(options, ctx) {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }
  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.SendHapticFeedback)
  ) {
    throw new Error(
      "'sendHapticFeedback' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }
  const payloadInput =
    options.hapticsType === 'selection-changed'
      ? { hapticsType: 'selection-changed' }
      : options.hapticsType === 'impact'
        ? {
            hapticsType: 'impact',
            style: options.style,
          }
        : {
            hapticsType: 'notification',
            style: options.style,
          };
  const payload = await new Promise((resolve, reject) => {
    try {
      ctx.events.subscribe(
        ResponseEvent.MiniAppSendHapticFeedback,
        (response) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppSendHapticFeedback);
          resolve(response);
        },
      );
      sendMiniKitEvent({
        command: Command.SendHapticFeedback,
        version: COMMAND_VERSIONS[Command.SendHapticFeedback],
        payload: payloadInput,
      });
    } catch (error) {
      reject(error);
    }
  });
  if (payload.status === 'error') {
    throw new SendHapticFeedbackError(payload.error_code);
  }
  return payload;
}
