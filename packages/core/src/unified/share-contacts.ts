/**
 * Unified share contacts command
 *
 * Works in World App only. Requires custom fallback on web.
 */

import { executeWithFallback } from '../fallback';
import type { CommandResult, FallbackConfig } from '../fallback/types';
import {
  createShareContactsCommand,
  createShareContactsAsyncCommand,
  ShareContactsInput,
  MiniAppShareContactsPayload,
  Contact,
} from '../../commands/share-contacts';
import { EventManager } from '../../core/events';
import { MiniKitState } from '../../core/state';

// ============================================================================
// Types
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

// Re-export Contact type
export type { Contact };

// ============================================================================
// Implementation
// ============================================================================

/**
 * Open the contact picker to select World App contacts
 *
 * Note: This command only works in World App. On web, you must provide a fallback.
 *
 * @example
 * ```typescript
 * // In World App
 * const result = await shareContacts({
 *   isMultiSelectEnabled: true,
 * });
 *
 * // On web with fallback
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
