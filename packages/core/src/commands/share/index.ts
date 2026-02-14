import { formatShareInput } from './format';
import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { EventManager } from '../../events';

export * from './types';
import type {
  MiniAppSharePayload,
  MiniAppShareSuccessPayload,
  ShareInput,
} from './types';
import { ShareError } from './types';

// ============================================================================
// Implementation
// ============================================================================

export async function share(
  input: ShareInput,
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

  // iOS uses native navigator.share
  if (
    ctx.state.deviceProperties.deviceOS === 'ios' &&
    typeof navigator !== 'undefined'
  ) {
    sendMiniKitEvent({
      command: Command.Share,
      version: COMMAND_VERSIONS[Command.Share],
      payload: input,
    });
    await navigator.share(input);
    // iOS doesn't send back a response event, return a synthetic success
    return {
      status: 'success',
      version: COMMAND_VERSIONS[Command.Share],
      shared_files_count: input.files?.length ?? 0,
      timestamp: new Date().toISOString(),
    };
  }

  // Android: format files to base64 and send via postMessage
  const formattedPayload = await formatShareInput(input);

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
