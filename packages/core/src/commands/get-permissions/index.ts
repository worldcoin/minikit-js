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
  GetPermissionsOptions,
  MiniAppGetPermissionsPayload,
  MiniAppGetPermissionsSuccessPayload,
} from './types';
import { GetPermissionsError } from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function getPermissions(
  options: GetPermissionsOptions = {},
  ctx?: CommandContext,
): Promise<CommandResult<MiniAppGetPermissionsSuccessPayload>> {
  return executeWithFallback({
    command: Command.GetPermissions,
    nativeExecutor: () => nativeGetPermissions(ctx),
    customFallback: options.fallback,
  });
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeGetPermissions(
  ctx?: CommandContext,
): Promise<MiniAppGetPermissionsSuccessPayload> {
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

  const payload = await new Promise<MiniAppGetPermissionsPayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(
          ResponseEvent.MiniAppGetPermissions,
          ((response: MiniAppGetPermissionsPayload) => {
            ctx!.events.unsubscribe(ResponseEvent.MiniAppGetPermissions);
            resolve(response);
          }) as any,
        );

        sendMiniKitEvent({
          command: Command.GetPermissions,
          version: COMMAND_VERSIONS[Command.GetPermissions],
          payload: {},
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (payload.status === 'error') {
    throw new GetPermissionsError(payload.error_code);
  }

  return payload;
}
