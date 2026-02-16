import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import type { CommandResultByVia } from '../types';
import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import type {
  MiniAppRequestPermissionPayload,
  MiniAppRequestPermissionSuccessPayload,
  MiniKitRequestPermissionOptions,
} from './types';
import { RequestPermissionError } from './types';

export * from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function requestPermission<
  TFallback = MiniAppRequestPermissionSuccessPayload,
>(
  options: MiniKitRequestPermissionOptions<TFallback>,
  ctx?: CommandContext,
): Promise<
  CommandResultByVia<
    MiniAppRequestPermissionSuccessPayload,
    TFallback,
    'minikit'
  >
> {
  const result = await executeWithFallback({
    command: Command.RequestPermission,
    nativeExecutor: () => nativeRequestPermission(options, ctx),
    customFallback: options.fallback,
  });

  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data as TFallback };
  }

  return {
    executedWith: 'minikit',
    data: result.data as MiniAppRequestPermissionSuccessPayload,
  };
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeRequestPermission(
  options: MiniKitRequestPermissionOptions<any>,
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
        ctx!.events.subscribe(ResponseEvent.MiniAppRequestPermission, ((
          response: MiniAppRequestPermissionPayload,
        ) => {
          ctx!.events.unsubscribe(ResponseEvent.MiniAppRequestPermission);
          resolve(response);
        }) as any);

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
