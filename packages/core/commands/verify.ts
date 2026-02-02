import { IDKitConfig, VerificationLevel } from '@worldcoin/idkit-core';
import { encodeAction, generateSignal } from '@worldcoin/idkit-core/hashing';
import { compressAndPadProof } from '../helpers/proof';
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

// Base type with common fields
type VerifyCommandInputBase = {
  action: IDKitConfig['action'];
  signal?: IDKitConfig['signal'];
};

// Single level input
type VerifyCommandInputSingle = VerifyCommandInputBase & {
  verification_level?: VerificationLevel;
  verification_levels?: never;
};

// Multi level input
type VerifyCommandInputMulti = VerifyCommandInputBase & {
  verification_level?: never;
  verification_levels: VerificationLevel[];
};

// Union type - user must choose one or the other (mutually exclusive)
export type VerifyCommandInput =
  | VerifyCommandInputSingle
  | VerifyCommandInputMulti;

// Full list of values sent to the app
export type VerifyCommandPayload = VerifyCommandInputBase & {
  verification_level?: VerificationLevel;
  verification_levels?: VerificationLevel[];
  timestamp: string;
};

export { VerificationLevel };

// Re-export from idkit-core for backwards compatibility
export { AppErrorCodes as VerificationErrorCodes } from '@worldcoin/idkit-core';

// Single verification success payload
export type MiniAppVerifyActionSuccessPayload = MiniAppBaseSuccessPayload & {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
};

// Individual verification result in array (for verification_levels input)
export type VerificationResult = Omit<
  MiniAppVerifyActionSuccessPayload,
  'status' | 'version'
>;

// Multi-verification success payload (for verification_levels input)
export type MiniAppVerifyActionMultiSuccessPayload = MiniAppBaseSuccessPayload & {
  verifications: VerificationResult[];
};

export type MiniAppVerifyActionErrorPayload = MiniAppBaseErrorPayload<string>;

export type MiniAppVerifyActionPayload =
  | MiniAppVerifyActionSuccessPayload
  | MiniAppVerifyActionMultiSuccessPayload
  | MiniAppVerifyActionErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createVerifyCommand(_ctx: CommandContext) {
  return (payload: VerifyCommandInput): VerifyCommandPayload | null => {
    if (typeof window === 'undefined' || !isCommandAvailable(Command.Verify)) {
      console.error(
        "'verify' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    // Mutual exclusivity validation (runtime check in addition to TypeScript)
    if (
      (payload as any).verification_level &&
      (payload as any).verification_levels
    ) {
      console.error(
        "'verify' command: cannot specify both 'verification_level' and 'verification_levels'. Use one or the other.",
      );
      return null;
    }

    const timestamp = new Date().toISOString();

    // Build payload based on which field was provided
    const eventPayload: VerifyCommandPayload = {
      action: encodeAction(payload.action),
      signal: generateSignal(payload.signal).digest,
      timestamp,
      ...((payload as any).verification_levels
        ? { verification_levels: (payload as any).verification_levels }
        : {
            verification_level:
              (payload as any).verification_level || VerificationLevel.Orb,
          }),
    };

    sendMiniKitEvent({
      command: Command.Verify,
      version: COMMAND_VERSIONS[Command.Verify],
      payload: eventPayload,
    });

    return eventPayload;
  };
}

export function createVerifyAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createVerifyCommand>,
) {
  return async (
    payload: VerifyCommandInput,
  ): AsyncHandlerReturn<
    VerifyCommandPayload | null,
    MiniAppVerifyActionPayload
  > => {
    return new Promise(async (resolve, reject) => {
      try {
        let commandPayload: VerifyCommandPayload | null = null;

        const handleResponse = async (response: MiniAppVerifyActionPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppVerifyAction);

          if (response.status === 'success') {
            // Check if this is a multi-verification response
            if ('verifications' in response) {
              // Multi-verification response: compress all Orb proofs
              const multiResponse =
                response as MiniAppVerifyActionMultiSuccessPayload;
              for (const verification of multiResponse.verifications) {
                if (verification.verification_level === VerificationLevel.Orb) {
                  verification.proof = await compressAndPadProof(
                    verification.proof as `0x${string}`,
                  );
                }
              }
            } else {
              // Single verification response
              const singleResponse =
                response as MiniAppVerifyActionSuccessPayload;
              if (singleResponse.verification_level === VerificationLevel.Orb) {
                singleResponse.proof = await compressAndPadProof(
                  singleResponse.proof as `0x${string}`,
                );
              }
            }
          }

          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppVerifyAction,
          handleResponse as any,
        );
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
