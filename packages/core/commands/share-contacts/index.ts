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
} from '../types';
import { executeWithFallback } from '../fallback';
import type { CommandResult, FallbackConfig } from '../fallback';
import { EventManager } from '../../events';
import { MiniKitState } from '../../state';

// ============================================================================
// Types
// ============================================================================

export type ShareContactsInput = {
  isMultiSelectEnabled: boolean;
  inviteMessage?: string;
};

export type ShareContactsPayload = ShareContactsInput;

export enum ShareContactsErrorCodes {
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export const ShareContactsErrorMessage = {
  [ShareContactsErrorCodes.UserRejected]: 'User rejected the request.',
  [ShareContactsErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export type Contact = {
  username: string;
  walletAddress: string;
  profilePictureUrl: string | null;
};

export type MiniAppShareContactsSuccessPayload = MiniAppBaseSuccessPayload & {
  contacts: Contact[];
  timestamp: string;
};

export type MiniAppShareContactsErrorPayload =
  MiniAppBaseErrorPayload<ShareContactsErrorCodes>;

export type MiniAppShareContactsPayload =
  | MiniAppShareContactsSuccessPayload
  | MiniAppShareContactsErrorPayload;

// ============================================================================
// Unified API Types
// ============================================================================

export interface UnifiedShareContactsOptions
  extends FallbackConfig<ShareContactsResult> {
  /** Enable multi-select in the contact picker */
  isMultiSelectEnabled?: boolean;

  /** Custom invite message for sharing */
  inviteMessage?: string;
}

export interface ShareContactsResult {
  /** Selected contacts */
  contacts: Contact[];
  /** Timestamp */
  timestamp: string;
}

// ============================================================================
// Native Command Implementation
// ============================================================================

export function createShareContactsCommand(_ctx: CommandContext) {
  return (payload: ShareContactsPayload): ShareContactsPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.ShareContacts)
    ) {
      console.error(
        "'shareContacts' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    sendMiniKitEvent({
      command: Command.ShareContacts,
      version: COMMAND_VERSIONS[Command.ShareContacts],
      payload,
    });

    return payload;
  };
}

export function createShareContactsAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createShareContactsCommand>,
) {
  return async (
    payload: ShareContactsPayload,
  ): AsyncHandlerReturn<
    ShareContactsPayload | null,
    MiniAppShareContactsPayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: ShareContactsPayload | null = null;

        const handleResponse = (response: MiniAppShareContactsPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppShareContacts);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppShareContacts,
          handleResponse as any,
        );
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

/**
 * Open the contact picker to select World App contacts
 *
 * Note: This command only works in World App. On web, you must provide a fallback.
 *
 * @example
 * ```typescript
 * const result = await shareContacts({
 *   isMultiSelectEnabled: true,
 *   fallback: () => showManualAddressInput(),
 * });
 *
 * console.log(result.data.contacts); // [{ username: '...', walletAddress: '...', ... }]
 * console.log(result.via); // 'minikit' | 'fallback'
 * ```
 */
export async function shareContacts(
  options: UnifiedShareContactsOptions = {}
): Promise<CommandResult<ShareContactsResult>> {
  return executeWithFallback({
    command: 'shareContacts',
    nativeExecutor: () => nativeShareContacts(options),
    // No Wagmi fallback - contacts is native only
    customFallback: options.fallback,
    requiresFallback: true, // Must provide fallback on web
  });
}

// Alias for backwards compatibility
export const getContacts = shareContacts;

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeShareContacts(
  options: UnifiedShareContactsOptions
): Promise<ShareContactsResult> {
  const eventManager = new EventManager();
  const stateManager = new MiniKitState();
  const ctx = { events: eventManager, state: stateManager };

  const syncCommand = createShareContactsCommand(ctx);
  const asyncCommand = createShareContactsAsyncCommand(ctx, syncCommand);

  const input: ShareContactsInput = {
    isMultiSelectEnabled: options.isMultiSelectEnabled ?? false,
    inviteMessage: options.inviteMessage,
  };

  const { finalPayload } = await asyncCommand(input);

  return normalizeNativeResult(finalPayload);
}

function normalizeNativeResult(
  payload: MiniAppShareContactsPayload
): ShareContactsResult {
  if (payload.status === 'error') {
    throw new ShareContactsError(payload.error_code);
  }

  return {
    contacts: payload.contacts,
    timestamp: payload.timestamp,
  };
}

// ============================================================================
// Errors
// ============================================================================

export class ShareContactsError extends Error {
  public readonly code: string;

  constructor(code: string) {
    super(`Share contacts failed: ${code}`);
    this.name = 'ShareContactsError';
    this.code = code;
  }
}
