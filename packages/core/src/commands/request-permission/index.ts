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
  MiniAppRequestPermissionPayload,
  MiniAppRequestPermissionSuccessPayload,
  RequestPermissionOptions,
} from './types';
import { RequestPermissionError } from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function requestPermission(
  options: RequestPermissionOptions,
  ctx?: CommandContext,
): Promise<CommandResult<MiniAppRequestPermissionSuccessPayload>> {
  return executeWithFallback({
    command: Command.RequestPermission,
    nativeExecutor: () => nativeRequestPermission(options, ctx),
    customFallback: options.fallback,
  });
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeRequestPermission(
  options: RequestPermissionOptions,
  ctx?: CommandContext,
): Promise<MiniAppRequestPermissionSuccessPayload> {
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

  const payload = await new Promise<MiniAppRequestPermissionPayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(
          ResponseEvent.MiniAppRequestPermission,
          ((response: MiniAppRequestPermissionPayload) => {
            ctx!.events.unsubscribe(ResponseEvent.MiniAppRequestPermission);
            resolve(response);
          }) as any,
        );

        sendMiniKitEvent({
          command: Command.RequestPermission,
          version: COMMAND_VERSIONS[Command.RequestPermission],
          payload: { permission: options.permission },
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (payload.status === 'error') {
    throw new RequestPermissionError(payload.error_code);
  }

  return payload;
}
