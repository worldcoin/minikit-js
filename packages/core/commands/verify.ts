import { IDKitConfig } from '@worldcoin/idkit-core';
import { encodeAction, generateSignal } from '@worldcoin/idkit-core/hashing';
import { VerificationLevel } from '../types/verification-level';
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
  verification_level?:
    | VerificationLevel
    | [VerificationLevel, ...VerificationLevel[]];
  skip_proof_compression?: boolean;
};

export type VerifyCommandPayload = Omit<
  VerifyCommandInput,
  'skip_proof_compression'
> & { timestamp: string };

export { VerificationLevel };

// Re-export from idkit-core for backwards compatibility
export { AppErrorCodes as VerificationErrorCodes } from '@worldcoin/idkit-core';

export type MiniAppVerifyActionSuccessPayload = MiniAppBaseSuccessPayload & {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
};

// Individual verification result (without status/version per entry)
export type VerificationResult = Omit<
  MiniAppVerifyActionSuccessPayload,
  'status' | 'version'
>;

export type MiniAppVerifyActionMultiSuccessPayload =
  MiniAppBaseSuccessPayload & {
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

export function createVerifyCommand(ctx: CommandContext) {
  return (payload: VerifyCommandInput): VerifyCommandPayload | null => {
    if (typeof window === 'undefined' || !isCommandAvailable(Command.Verify)) {
      console.error(
        "'verify' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    if (
      Array.isArray(payload.verification_level) &&
      payload.verification_level.length === 0
    ) {
      console.error("'verification_level' must not be an empty array");
      return null;
    }

    const timestamp = new Date().toISOString();
    const eventPayload: VerifyCommandPayload = {
      action: encodeAction(payload.action),
      signal: generateSignal(payload.signal).digest,
      verification_level: payload.verification_level || VerificationLevel.Orb,
      timestamp,
    };

    ctx.events.setVerifyActionProcessingOptions({
      skip_proof_compression: payload.skip_proof_compression,
    });

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
  let hasInFlightVerifyRequest = false;

  return async (
    payload: VerifyCommandInput,
  ): AsyncHandlerReturn<
    VerifyCommandPayload | null,
    MiniAppVerifyActionPayload
  > => {
    if (hasInFlightVerifyRequest) {
      return Promise.reject(
        new Error(
          'A verify request is already in flight. Wait for the current request to complete before sending another.',
        ),
      );
    }

    return new Promise((resolve, reject) => {
      try {
        hasInFlightVerifyRequest = true;
        let commandPayload: VerifyCommandPayload | null = null;

        const handleResponse = (response: MiniAppVerifyActionPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppVerifyAction);
          hasInFlightVerifyRequest = false;
          // Proof compression and error normalization handled by EventManager.trigger()
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppVerifyAction,
          handleResponse as any,
        );
        commandPayload = syncCommand(payload);

        if (commandPayload === null) {
          ctx.events.unsubscribe(ResponseEvent.MiniAppVerifyAction);
          hasInFlightVerifyRequest = false;
          reject(
            new Error(
              'Failed to send verify command. Ensure MiniKit is installed and the verify command is available.',
            ),
          );
        }
      } catch (error) {
        hasInFlightVerifyRequest = false;
        reject(error);
      }
    });
  };
}
