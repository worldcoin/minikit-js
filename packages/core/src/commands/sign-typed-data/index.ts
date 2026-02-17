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
import { wagmiSignTypedData } from '../wagmi-fallback';
import type {
  MiniAppSignTypedDataPayload,
  MiniAppSignTypedDataSuccessPayload,
  MiniKitSignTypedDataOptions,
} from './types';
import { SignTypedDataError } from './types';

export * from './types';

const NATIVE_RESPONSE_TIMEOUT_MS = 10000;

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function signTypedData<TFallback = MiniAppSignTypedDataPayload>(
  options: MiniKitSignTypedDataOptions<TFallback>,
  ctx?: CommandContext,
): Promise<CommandResultByVia<MiniAppSignTypedDataSuccessPayload, TFallback>> {
  const result = await executeWithFallback({
    command: Command.SignTypedData,
    nativeExecutor: () => nativeSignTypedData(options, ctx),
    wagmiFallback: () =>
      wagmiSignTypedData({
        types: options.types,
        primaryType: options.primaryType,
        message: options.message,
        domain: options.domain,
        chainId: options.chainId,
      }),
    customFallback: options.fallback,
  });

  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data as TFallback };
  }

  if (result.executedWith === 'wagmi') {
    return {
      executedWith: 'wagmi',
      data: result.data as MiniAppSignTypedDataSuccessPayload,
    };
  }

  return {
    executedWith: 'minikit',
    data: result.data as MiniAppSignTypedDataSuccessPayload,
  };
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeSignTypedData(
  options: MiniKitSignTypedDataOptions<any>,
  ctx?: CommandContext,
): Promise<MiniAppSignTypedDataSuccessPayload> {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }

  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.SignTypedData)
  ) {
    throw new Error(
      "'signTypedData' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  const payloadInput = {
    types: options.types,
    primaryType: options.primaryType,
    message: options.message,
    domain: options.domain,
    chainId: options.chainId ?? 480,
  };

  const payload = await new Promise<MiniAppSignTypedDataPayload>(
    (resolve, reject) => {
      const timeout = setTimeout(() => {
        ctx!.events.unsubscribe(ResponseEvent.MiniAppSignTypedData);
        reject(
          new Error(
            `signTypedData response timed out after ${Math.floor(
              NATIVE_RESPONSE_TIMEOUT_MS / 1000,
            )}s`,
          ),
        );
      }, NATIVE_RESPONSE_TIMEOUT_MS);

      try {
        ctx!.events.subscribe(ResponseEvent.MiniAppSignTypedData, ((
          response: MiniAppSignTypedDataPayload,
        ) => {
          clearTimeout(timeout);
          ctx!.events.unsubscribe(ResponseEvent.MiniAppSignTypedData);
          resolve(response);
        }) as any);

        sendMiniKitEvent({
          command: Command.SignTypedData,
          version: COMMAND_VERSIONS[Command.SignTypedData],
          payload: payloadInput,
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    },
  );

  if (payload.status === 'error') {
    throw new SignTypedDataError(payload.error_code);
  }

  return payload;
}
