import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import type { CommandResult } from '../types';
import { executeWithFallback } from '../fallback';
import { EventManager } from '../../events';

export * from './types';
import type {
  ShareContactsInput,
  ShareContactsPayload,
  ShareContactsOptions,
  ShareContactsResult,
  MiniAppShareContactsPayload,
} from './types';
import { ShareContactsError } from './types';

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
  options: ShareContactsOptions = {},
  ctx?: CommandContext,
): Promise<CommandResult<ShareContactsResult>> {
  return executeWithFallback({
    command: Command.ShareContacts,
    nativeExecutor: () => nativeShareContacts(options, ctx),
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
  options: ShareContactsOptions,
  ctx?: CommandContext,
): Promise<ShareContactsResult> {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }

  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.ShareContacts)
  ) {
    throw new Error(
      "'shareContacts' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  const input: ShareContactsInput = {
    isMultiSelectEnabled: options.isMultiSelectEnabled ?? false,
    inviteMessage: options.inviteMessage,
  };

  const payload: ShareContactsPayload = input;

  const finalPayload = await new Promise<MiniAppShareContactsPayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(
          ResponseEvent.MiniAppShareContacts,
          ((response: MiniAppShareContactsPayload) => {
            ctx!.events.unsubscribe(ResponseEvent.MiniAppShareContacts);
            resolve(response);
          }) as any,
        );

        sendMiniKitEvent({
          command: Command.ShareContacts,
          version: COMMAND_VERSIONS[Command.ShareContacts],
          payload,
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (finalPayload.status === 'error') {
    throw new ShareContactsError(finalPayload.error_code);
  }

  return {
    contacts: finalPayload.contacts,
    timestamp: finalPayload.timestamp,
  };
}
