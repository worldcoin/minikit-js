import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import {
  Command,
  COMMAND_VERSIONS,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { GetPermissionsError } from './types';
export * from './types';
// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================
export async function getPermissions(options, ctx) {
  const resolvedOptions = options ?? {};
  const result = await executeWithFallback({
    command: Command.GetPermissions,
    nativeExecutor: () => nativeGetPermissions(ctx),
    customFallback: resolvedOptions.fallback,
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
async function nativeGetPermissions(ctx) {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }
  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.GetPermissions)
  ) {
    throw new Error(
      "'getPermissions' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }
  const payload = await new Promise((resolve, reject) => {
    try {
      ctx.events.subscribe(ResponseEvent.MiniAppGetPermissions, (response) => {
        ctx.events.unsubscribe(ResponseEvent.MiniAppGetPermissions);
        resolve(response);
      });
      sendMiniKitEvent({
        command: Command.GetPermissions,
        version: COMMAND_VERSIONS[Command.GetPermissions],
        payload: {},
      });
    } catch (error) {
      reject(error);
    }
  });
  if (payload.status === 'error') {
    throw new GetPermissionsError(payload.error_code);
  }
  return payload;
}
