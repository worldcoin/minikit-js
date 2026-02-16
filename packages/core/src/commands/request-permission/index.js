import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import {
  Command,
  COMMAND_VERSIONS,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { RequestPermissionError } from './types';
export * from './types';
// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================
export async function requestPermission(options, ctx) {
  const result = await executeWithFallback({
    command: Command.RequestPermission,
    nativeExecutor: () => nativeRequestPermission(options, ctx),
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
async function nativeRequestPermission(options, ctx) {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }
  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.RequestPermission)
  ) {
    throw new Error(
      "'requestPermission' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }
  const payload = await new Promise((resolve, reject) => {
    try {
      ctx.events.subscribe(
        ResponseEvent.MiniAppRequestPermission,
        (response) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppRequestPermission);
          resolve(response);
        },
      );
      sendMiniKitEvent({
        command: Command.RequestPermission,
        version: COMMAND_VERSIONS[Command.RequestPermission],
        payload: { permission: options.permission },
      });
    } catch (error) {
      reject(error);
    }
  });
  if (payload.status === 'error') {
    throw new RequestPermissionError(payload.error_code);
  }
  return payload;
}
