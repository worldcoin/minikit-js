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
  MiniAppSignMessagePayload,
  MiniAppSignMessageSuccessPayload,
  SignMessageInput,
} from './types';
import { SignMessageError } from './types';

// ============================================================================
// Implementation
// ============================================================================

export async function signMessage(
  input: SignMessageInput,
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
          payload: input,
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
