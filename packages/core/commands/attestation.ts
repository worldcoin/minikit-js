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

// Developer-facing input type (camelCase)
export type AttestationInput = {
  /**
   * Hex-encoded hash of the request to be attested.
   * Hash must be generated per hashing spec documented in MiniKit docs.
   */
  requestHash: string;
};

// Wire payload sent to World App (snake_case)
export type AttestationPayload = {
  request_hash: string;
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
  return (input: AttestationInput): AttestationPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.Attestation)
    ) {
      console.error(
        "'attestation' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    if (!input.requestHash || input.requestHash.length === 0) {
      console.error("'attestation' command requires a non-empty requestHash");
      return null;
    }

    const payload: AttestationPayload = {
      request_hash: input.requestHash,
    };

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
    input: AttestationInput,
  ): AsyncHandlerReturn<
    AttestationPayload | null,
    MiniAppAttestationPayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        const handleResponse = (response: MiniAppAttestationPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppAttestation);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppAttestation,
          handleResponse as any,
        );

        const commandPayload = syncCommand(input);

        // If dispatch failed locally, clean up the subscription and reject
        // immediately — no response event will ever arrive.
        if (!commandPayload) {
          ctx.events.unsubscribe(ResponseEvent.MiniAppAttestation);
          reject(
            new Error(
              "'attestation' command failed: command unavailable or invalid input",
            ),
          );
        }
      } catch (error) {
        ctx.events.unsubscribe(ResponseEvent.MiniAppAttestation);
        reject(error);
      }
    });
  };
}
