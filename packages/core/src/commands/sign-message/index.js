import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import {
  Command,
  COMMAND_VERSIONS,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { wagmiSignMessage } from '../wagmi-fallback';
import { SignMessageError } from './types';
export * from './types';
// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================
export async function signMessage(options, ctx) {
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
async function nativeSignMessage(options, ctx) {
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
  const payload = await new Promise((resolve, reject) => {
    try {
      ctx.events.subscribe(ResponseEvent.MiniAppSignMessage, (response) => {
        ctx.events.unsubscribe(ResponseEvent.MiniAppSignMessage);
        resolve(response);
      });
      sendMiniKitEvent({
        command: Command.SignMessage,
        version: COMMAND_VERSIONS[Command.SignMessage],
        payload: { message: options.message },
      });
    } catch (error) {
      reject(error);
    }
  });
  if (payload.status === 'error') {
    throw new SignMessageError(payload.error_code);
  }
  return payload;
}
