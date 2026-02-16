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
  MiniAppSendHapticFeedbackPayload,
  MiniAppSendHapticFeedbackSuccessPayload,
  MiniKitSendHapticFeedbackOptions,
} from './types';
import { SendHapticFeedbackError } from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

export async function sendHapticFeedback<
  TFallback = MiniAppSendHapticFeedbackSuccessPayload,
>(
  options: MiniKitSendHapticFeedbackOptions<TFallback>,
  ctx?: CommandContext,
): Promise<
  CommandResultByVia<
    MiniAppSendHapticFeedbackSuccessPayload,
    TFallback,
    'minikit'
  >
> {
  const result = await executeWithFallback({
    command: Command.SendHapticFeedback,
    nativeExecutor: () => nativeSendHapticFeedback(options, ctx),
    customFallback: options.fallback,
  });

  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data as TFallback };
  }

  return {
    executedWith: 'minikit',
    data: result.data as MiniAppSendHapticFeedbackSuccessPayload,
  };
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeSendHapticFeedback(
  options: MiniKitSendHapticFeedbackOptions<any>,
  ctx?: CommandContext,
): Promise<MiniAppSendHapticFeedbackSuccessPayload> {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }

  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.SendHapticFeedback)
  ) {
    throw new Error(
      "'sendHapticFeedback' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  const payloadInput =
    options.hapticsType === 'selection-changed'
      ? { hapticsType: 'selection-changed' }
      : options.hapticsType === 'impact'
        ? {
            hapticsType: 'impact',
            style: options.style,
          }
        : {
            hapticsType: 'notification',
            style: options.style,
          };

  const payload = await new Promise<MiniAppSendHapticFeedbackPayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(
          ResponseEvent.MiniAppSendHapticFeedback,
          ((response: MiniAppSendHapticFeedbackPayload) => {
            ctx!.events.unsubscribe(ResponseEvent.MiniAppSendHapticFeedback);
            resolve(response);
          }) as any,
        );

        sendMiniKitEvent({
          command: Command.SendHapticFeedback,
          version: COMMAND_VERSIONS[Command.SendHapticFeedback],
          payload: payloadInput,
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (payload.status === 'error') {
    throw new SendHapticFeedbackError(payload.error_code);
  }

  return payload;
}
