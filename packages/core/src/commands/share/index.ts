import { formatShareInput } from './format';
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
import { EventManager } from '../../events';

export * from './types';
import type {
  MiniAppSharePayload,
  MiniAppShareSuccessPayload,
  MiniKitShareOptions,
} from './types';
import { ShareError } from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function share<TFallback = MiniAppShareSuccessPayload>(
  options: MiniKitShareOptions<TFallback>,
  ctx?: CommandContext,
): Promise<
  CommandResultByVia<MiniAppShareSuccessPayload, TFallback, 'minikit'>
> {
  const result = await executeWithFallback({
    command: Command.Share,
    nativeExecutor: () => nativeShare(options, ctx),
    customFallback: options.fallback,
  });

  if (result.executedWith === 'fallback') {
    return {
      executedWith: 'fallback',
      data: result.data as TFallback,
    };
  }

  return {
    executedWith: 'minikit',
    data: result.data as MiniAppShareSuccessPayload,
  };
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeShare(
  options: MiniKitShareOptions<any>,
  ctx?: CommandContext,
): Promise<MiniAppShareSuccessPayload> {
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

  const payload = await new Promise<MiniAppSharePayload>((resolve, reject) => {
    try {
      ctx!.events.subscribe(
        ResponseEvent.MiniAppShare,
        ((response: MiniAppSharePayload) => {
          ctx!.events.unsubscribe(ResponseEvent.MiniAppShare);
          resolve(response);
        }) as any,
      );

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
