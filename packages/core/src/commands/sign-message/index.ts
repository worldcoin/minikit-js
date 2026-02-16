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
import { wagmiSignMessage } from '../wagmi-fallback';
import type {
  MiniAppSignMessagePayload,
  MiniAppSignMessageSuccessPayload,
  MiniKitSignMessageOptions,
} from './types';
import { SignMessageError } from './types';

export * from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function signMessage<
  TFallback = MiniAppSignMessageSuccessPayload,
>(
  options: MiniKitSignMessageOptions<TFallback>,
  ctx?: CommandContext,
): Promise<CommandResultByVia<MiniAppSignMessageSuccessPayload, TFallback>> {
  const result = await executeWithFallback({
    command: Command.SignMessage,
    nativeExecutor: () => nativeSignMessage(options, ctx),
    wagmiFallback: () =>
      wagmiSignMessage({
        message: options.message,
      }),
    customFallback: options.fallback,
  });

  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data as TFallback };
  }

  if (result.executedWith === 'wagmi') {
    return {
      executedWith: 'wagmi',
      data: result.data as MiniAppSignMessageSuccessPayload,
    };
  }

  return {
    executedWith: 'minikit',
    data: result.data as MiniAppSignMessageSuccessPayload,
  };
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeSignMessage(
  options: MiniKitSignMessageOptions<any>,
  ctx?: CommandContext,
): Promise<MiniAppSignMessageSuccessPayload> {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }

  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.SignMessage)
  ) {
    throw new Error(
      "'signMessage' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  const payload = await new Promise<MiniAppSignMessagePayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(ResponseEvent.MiniAppSignMessage, ((
          response: MiniAppSignMessagePayload,
        ) => {
          ctx!.events.unsubscribe(ResponseEvent.MiniAppSignMessage);
          resolve(response);
        }) as any);

        sendMiniKitEvent({
          command: Command.SignMessage,
          version: COMMAND_VERSIONS[Command.SignMessage],
          payload: { message: options.message },
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (payload.status === 'error') {
    throw new SignMessageError(payload.error_code);
  }

  return payload;
}
