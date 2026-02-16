import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import {
  Command,
  COMMAND_VERSIONS,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { ShareContactsError } from './types';
export * from './types';
// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================
/**
 * Open the contact picker to select World App contacts
 *
 * Note: This command works natively in World App. On web, provide a fallback if needed.
 *
 * @example
 * ```typescript
 * const result = await shareContacts({
 *   isMultiSelectEnabled: true,
 *   fallback: () => showManualAddressInput(),
 * });
 *
 * console.log(result.data.contacts); // [{ username: '...', walletAddress: '...', ... }]
 * console.log(result.executedWith); // 'minikit' | 'fallback'
 * ```
 */
export async function shareContacts(options, ctx) {
  const resolvedOptions = options ?? {};
  const result = await executeWithFallback({
    command: Command.ShareContacts,
    nativeExecutor: () => nativeShareContacts(resolvedOptions, ctx),
    // No Wagmi fallback - contacts is native only
    customFallback: resolvedOptions.fallback,
  });
  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data };
  }
  return { executedWith: 'minikit', data: result.data };
}
// Alias for backwards compatibility
export const getContacts = shareContacts;
// ============================================================================
// Native Implementation (World App)
// ============================================================================
async function nativeShareContacts(options, ctx) {
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
  const payload = {
    isMultiSelectEnabled: options.isMultiSelectEnabled ?? false,
    inviteMessage: options.inviteMessage,
  };
  const finalPayload = await new Promise((resolve, reject) => {
    try {
      ctx.events.subscribe(ResponseEvent.MiniAppShareContacts, (response) => {
        ctx.events.unsubscribe(ResponseEvent.MiniAppShareContacts);
        resolve(response);
      });
      sendMiniKitEvent({
        command: Command.ShareContacts,
        version: COMMAND_VERSIONS[Command.ShareContacts],
        payload,
      });
    } catch (error) {
      reject(error);
    }
  });
  if (finalPayload.status === 'error') {
    throw new ShareContactsError(finalPayload.error_code);
  }
  return {
    contacts: finalPayload.contacts,
    timestamp: finalPayload.timestamp,
  };
}
