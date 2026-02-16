import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import {
  Command,
  COMMAND_VERSIONS,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { wagmiSignTypedData } from '../wagmi-fallback';
import { SignTypedDataError } from './types';
export * from './types';
// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================
export async function signTypedData(options, ctx) {
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
    return { executedWith: 'fallback', data: result.data };
  }
  if (result.executedWith === 'wagmi') {
    return {
      executedWith: 'wagmi',
      data: result.data,
    };
  }
  return {
    executedWith: 'minikit',
    data: result.data,
  };
}
// ============================================================================
// Native Implementation (World App)
// ============================================================================
async function nativeSignTypedData(options, ctx) {
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
  const payload = await new Promise((resolve, reject) => {
    try {
      ctx.events.subscribe(ResponseEvent.MiniAppSignTypedData, (response) => {
        ctx.events.unsubscribe(ResponseEvent.MiniAppSignTypedData);
        resolve(response);
      });
      sendMiniKitEvent({
        command: Command.SignTypedData,
        version: COMMAND_VERSIONS[Command.SignTypedData],
        payload: payloadInput,
      });
    } catch (error) {
      reject(error);
    }
  });
  if (payload.status === 'error') {
    throw new SignTypedDataError(payload.error_code);
  }
  return payload;
}
