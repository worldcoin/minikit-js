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
  MiniAppSignTypedDataPayload,
  MiniAppSignTypedDataSuccessPayload,
  SignTypedDataInput,
} from './types';
import { SignTypedDataError } from './types';

// ============================================================================
// Implementation
// ============================================================================

export async function signTypedData(
  input: SignTypedDataInput,
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

  // Default to Worldchain
  if (!input.chainId) {
    input.chainId = 480;
  }

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
          payload: input,
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
