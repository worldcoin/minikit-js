import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import {
  Command,
  COMMAND_VERSIONS,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { formatShareInput } from './format';
import { ShareError } from './types';
export * from './types';
// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================
export async function share(options, ctx) {
  const result = await executeWithFallback({
    command: Command.Share,
    nativeExecutor: () => nativeShare(options, ctx),
    customFallback: options.fallback,
  });
  if (result.executedWith === 'fallback') {
    return {
      executedWith: 'fallback',
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
async function nativeShare(options, ctx) {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }
  if (typeof window === 'undefined' || !isCommandAvailable(Command.Share)) {
    throw new Error(
      "'share' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }
  const payloadInput = {
    files: options.files,
    title: options.title,
    text: options.text,
    url: options.url,
  };
  // iOS uses native navigator.share
  if (
    ctx.state.deviceProperties.deviceOS === 'ios' &&
    typeof navigator !== 'undefined'
  ) {
    sendMiniKitEvent({
      command: Command.Share,
      version: COMMAND_VERSIONS[Command.Share],
      payload: payloadInput,
    });
    await navigator.share(payloadInput);
    // iOS doesn't send back a response event, return a synthetic success
    return {
      status: 'success',
      version: COMMAND_VERSIONS[Command.Share],
      shared_files_count: payloadInput.files?.length ?? 0,
      timestamp: new Date().toISOString(),
    };
  }
  // Android: format files to base64 and send via postMessage
  const formattedPayload = await formatShareInput(payloadInput);
  const payload = await new Promise((resolve, reject) => {
    try {
      ctx.events.subscribe(ResponseEvent.MiniAppShare, (response) => {
        ctx.events.unsubscribe(ResponseEvent.MiniAppShare);
        resolve(response);
      });
      sendMiniKitEvent({
        command: Command.Share,
        version: COMMAND_VERSIONS[Command.Share],
        payload: formattedPayload,
      });
    } catch (error) {
      reject(error);
    }
  });
  if (payload.status === 'error') {
    throw new ShareError(payload.error_code);
  }
  return payload;
}
