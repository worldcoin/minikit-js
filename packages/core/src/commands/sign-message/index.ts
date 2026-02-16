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
import { wagmiSignMessage } from '../wagmi-fallback';
import { EventManager } from '../../events';

export * from './types';
import type {
  MiniAppSignMessagePayload,
  MiniAppSignMessageSuccessPayload,
  SignMessageOptions,
} from './types';
import { SignMessageError } from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function signMessage(
  options: SignMessageOptions,
  ctx?: CommandContext,
): Promise<CommandResult<MiniAppSignMessageSuccessPayload>> {
  return executeWithFallback({
    command: Command.SignMessage,
    nativeExecutor: () => nativeSignMessage(options, ctx),
    wagmiFallback: () =>
      wagmiSignMessage({
        message: options.message,
      }),
    customFallback: options.fallback,
  });
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeSignMessage(
  options: SignMessageOptions,
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
        ctx!.events.subscribe(
          ResponseEvent.MiniAppSignMessage,
          ((response: MiniAppSignMessagePayload) => {
            ctx!.events.unsubscribe(ResponseEvent.MiniAppSignMessage);
            resolve(response);
          }) as any,
        );

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
