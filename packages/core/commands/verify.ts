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

export type VerifyCommandInput = {
  action: IDKitConfig['action'];
  signal?: IDKitConfig['signal'];
  verification_level?: VerificationLevel | VerificationLevel[];
};

export type VerifyCommandPayload = {
  action: IDKitConfig['action'];
  signal?: IDKitConfig['signal'];
  verification_level?: VerificationLevel | VerificationLevel[];
  timestamp: string;
};

export { VerificationLevel };

// Re-export from idkit-core for backwards compatibility
export { AppErrorCodes as VerificationErrorCodes } from '@worldcoin/idkit-core';

export type MiniAppVerifyActionSuccessPayload = MiniAppBaseSuccessPayload & {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
};

// Individual verification result in array (for verification_levels input)
export type VerificationResult = {
  verification_level: VerificationLevel;
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
};

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

    const timestamp = new Date().toISOString();
    const eventPayload: VerifyCommandPayload = {
      action: encodeAction(payload.action),
      signal: generateSignal(payload.signal).digest,
      verification_level: payload.verification_level || VerificationLevel.Orb,
      timestamp,
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
            // Check if multi-verification response (array input)
            if ('verifications' in response) {
              // Compress all Orb proofs in the array
              for (const verification of response.verifications) {
                if (verification.verification_level === VerificationLevel.Orb) {
                  verification.proof = await compressAndPadProof(
                    verification.proof as `0x${string}`,
                  );
                }
              }
            } else if (response.verification_level === VerificationLevel.Orb) {
              // Single verification response
              response.proof = await compressAndPadProof(
                response.proof as `0x${string}`,
              );
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