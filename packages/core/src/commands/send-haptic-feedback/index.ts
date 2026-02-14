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
  MiniAppSendHapticFeedbackPayload,
  MiniAppSendHapticFeedbackSuccessPayload,
  SendHapticFeedbackInput,
} from './types';
import { SendHapticFeedbackError } from './types';

// ============================================================================
// Implementation
// ============================================================================

export async function sendHapticFeedback(
  input: SendHapticFeedbackInput,
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
          payload: input,
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
