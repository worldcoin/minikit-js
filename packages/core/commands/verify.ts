import { VerificationLevel, IDKitConfig } from '@worldcoin/idkit-core';
import { encodeAction, generateSignal } from '@worldcoin/idkit-core/hashing';
import { compressAndPadProof } from '../helpers/proof';
import {
  Command,
  CommandContext,
  COMMAND_VERSIONS,
  isCommandAvailable,
  sendMiniKitEvent,
  ResponseEvent,
  AsyncHandlerReturn,
} from './types';

// ============================================================================
// Types
// ============================================================================

export type VerifyCommandInput = {
  action: IDKitConfig['action'];
  signal?: IDKitConfig['signal'];
  verification_level?: VerificationLevel;
};

export type VerifyCommandPayload = VerifyCommandInput & {
  timestamp: string;
};

export { VerificationLevel };

// Re-export from idkit-core for backwards compatibility
export { AppErrorCodes as VerificationErrorCodes } from '@worldcoin/idkit-core';

export type MiniAppVerifyActionSuccessPayload = {
  status: 'success';
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
  version: number;
};

export type MiniAppVerifyActionErrorPayload = {
  status: 'error';
  error_code: string;
  version: number;
};

export type MiniAppVerifyActionPayload =
  | MiniAppVerifyActionSuccessPayload
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
  ): AsyncHandlerReturn<VerifyCommandPayload | null, MiniAppVerifyActionPayload> => {
    return new Promise(async (resolve, reject) => {
      try {
        let commandPayload: VerifyCommandPayload | null = null;

        const handleResponse = async (response: MiniAppVerifyActionPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppVerifyAction);

          // Compress proof for Orb verification
          if (
            response.status === 'success' &&
            response.verification_level === VerificationLevel.Orb
          ) {
            response.proof = await compressAndPadProof(
              response.proof as `0x${string}`,
            );
          }

          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(ResponseEvent.MiniAppVerifyAction, handleResponse as any);
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
