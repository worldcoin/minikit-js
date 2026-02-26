import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import type { CommandResultByVia } from '../types';
import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import type {
  MiniAppAttestationPayload,
  MiniAppAttestationSuccessPayload,
  MiniKitAttestationOptions,
} from './types';
import { AttestationError } from './types';

export * from './types';

export async function attestation<
  TFallback = MiniAppAttestationSuccessPayload,
>(
  options: MiniKitAttestationOptions<TFallback>,
  ctx?: CommandContext,
): Promise<
  CommandResultByVia<MiniAppAttestationSuccessPayload, TFallback, 'minikit'>
> {
  const result = await executeWithFallback({
    command: Command.Attestation,
    nativeExecutor: () => nativeAttestation(options, ctx),
    customFallback: options.fallback,
  });

  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data as TFallback };
  }

  return {
    executedWith: 'minikit',
    data: result.data as MiniAppAttestationSuccessPayload,
  };
}

async function nativeAttestation(
  options: MiniKitAttestationOptions<any>,
  ctx?: CommandContext,
): Promise<MiniAppAttestationSuccessPayload> {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }

  if (typeof window === 'undefined' || !isCommandAvailable(Command.Attestation)) {
    throw new Error(
      "'attestation' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  if (!options.requestHash || options.requestHash.length === 0) {
    throw new Error("'attestation' command requires a non-empty requestHash");
  }

  const payload = await new Promise<MiniAppAttestationPayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(ResponseEvent.MiniAppAttestation, ((
          response: MiniAppAttestationPayload,
        ) => {
          ctx!.events.unsubscribe(ResponseEvent.MiniAppAttestation);
          resolve(response);
        }) as any);

        sendMiniKitEvent({
          command: Command.Attestation,
          version: COMMAND_VERSIONS[Command.Attestation],
          payload: {
            request_hash: options.requestHash,
          },
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (payload.status === 'error') {
    throw new AttestationError(payload.error_code);
  }

  return payload;
}
