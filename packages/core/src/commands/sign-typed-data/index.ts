import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import type { CommandResultByVia } from '../types';
import { executeWithFallback } from '../fallback';
import { wagmiSignTypedData } from '../wagmi-fallback';
import { EventManager } from '../../events';

export * from './types';
import type {
  MiniKitSignTypedDataOptions,
  MiniAppSignTypedDataPayload,
  MiniAppSignTypedDataSuccessPayload,
} from './types';
import { SignTypedDataError } from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function signTypedData<
  TFallback = MiniAppSignTypedDataSuccessPayload,
>(
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
      try {
        ctx!.events.subscribe(
          ResponseEvent.MiniAppSignTypedData,
          ((response: MiniAppSignTypedDataPayload) => {
            ctx!.events.unsubscribe(ResponseEvent.MiniAppSignTypedData);
            resolve(response);
          }) as any,
        );

        sendMiniKitEvent({
          command: Command.SignTypedData,
          version: COMMAND_VERSIONS[Command.SignTypedData],
          payload: payloadInput,
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (payload.status === 'error') {
    throw new SignTypedDataError(payload.error_code);
  }

  return payload;
}
