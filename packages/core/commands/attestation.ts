import {
  AsyncHandlerReturn,
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
  ResponseEvent,
  sendMiniKitEvent,
} from './types';

// ============================================================================
// Types
// ============================================================================

export type AttestationPayload = {
  /**
   * Base64URL-encoded hash of the request to be attested.
   * Hash must be generated per hashing spec documented in MiniKit docs.
   */
  requestHash: string;
};

export enum AttestationErrorCodes {
  Unauthorized = 'unauthorized',
  AttestationFailed = 'attestation_failed',
  IntegrityFailed = 'integrity_failed',
  InvalidInput = 'invalid_input',
  UnsupportedVersion = 'unsupported_version',
}

export const AttestationErrorMessage: Record<AttestationErrorCodes, string> = {
  [AttestationErrorCodes.Unauthorized]:
    'App is not whitelisted for attestation.',
  [AttestationErrorCodes.AttestationFailed]:
    'Failed to obtain token from attestation gateway.',
  [AttestationErrorCodes.IntegrityFailed]: 'Platform integrity check failed.',
  [AttestationErrorCodes.InvalidInput]: 'Invalid request payload.',
  [AttestationErrorCodes.UnsupportedVersion]:
    'Command version is not supported.',
};

export type MiniAppAttestationSuccessPayload = MiniAppBaseSuccessPayload & {
  token: string;
};

export type MiniAppAttestationErrorPayload =
  MiniAppBaseErrorPayload<AttestationErrorCodes> & {
    description: string;
  };

export type MiniAppAttestationPayload =
  | MiniAppAttestationSuccessPayload
  | MiniAppAttestationErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createAttestationCommand(_ctx: CommandContext) {
  return (payload: AttestationPayload): AttestationPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.Attestation)
    ) {
      console.error(
        "'attestation' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    if (!payload.requestHash || payload.requestHash.length === 0) {
      console.error("'attestation' command requires a non-empty requestHash");
      return null;
    }

    sendMiniKitEvent({
      command: Command.Attestation,
      version: COMMAND_VERSIONS[Command.Attestation],
      payload,
    });

    return payload;
  };
}

export function createAttestationAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createAttestationCommand>,
) {
  return async (
    payload: AttestationPayload,
  ): AsyncHandlerReturn<
    AttestationPayload | null,
    MiniAppAttestationPayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: AttestationPayload | null = null;

        const handleResponse = (response: MiniAppAttestationPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppAttestation);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppAttestation,
          handleResponse as any,
        );
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
