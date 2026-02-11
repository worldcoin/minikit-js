/**
 * Unified wallet auth command
 *
 * Works in both World App (native SIWE) and web (Wagmi + SIWE fallback).
 */

import { isInWorldApp, executeWithFallback } from '../fallback';
import { wagmiWalletAuth } from '../fallback/wagmi';
import type { CommandResult, FallbackConfig } from '../fallback/types';
import {
  createWalletAuthCommand,
  createWalletAuthAsyncCommand,
  WalletAuthInput,
  MiniAppWalletAuthPayload,
} from '../../commands/wallet-auth';
import { EventManager } from '../../core/events';
import { MiniKitState } from '../../core/state';

// ============================================================================
// Types
// ============================================================================

export interface UnifiedWalletAuthOptions extends FallbackConfig<WalletAuthResult> {
  /** Nonce for SIWE message (should be generated server-side) */
  nonce: string;

  /** Optional statement to include in SIWE message */
  statement?: string;

  /** Optional request ID for tracking */
  requestId?: string;

  /** Optional expiration time for the SIWE message */
  expirationTime?: Date;

  /** Optional not-before time for the SIWE message */
  notBefore?: Date;
}

export interface WalletAuthResult {
  /** Wallet address */
  address: string;
  /** Signed SIWE message */
  message: string;
  /** Signature */
  signature: string;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * Authenticate user via wallet signature (SIWE)
 *
 * @example
 * ```typescript
 * // Basic usage - works in World App and web
 * const result = await walletAuth({ nonce: 'random-nonce' });
 * console.log(result.data.address); // '0x...'
 * console.log(result.via); // 'minikit' | 'wagmi' | 'fallback'
 *
 * // With custom fallback
 * const result = await walletAuth({
 *   nonce: 'random-nonce',
 *   fallback: () => signInWithOAuth(),
 * });
 * ```
 */
export async function walletAuth(
  options: UnifiedWalletAuthOptions
): Promise<CommandResult<WalletAuthResult>> {
  return executeWithFallback({
    command: 'walletAuth',
    nativeExecutor: () => nativeWalletAuth(options),
    wagmiFallback: () =>
      wagmiWalletAuth({
        nonce: options.nonce,
        statement: options.statement,
        expirationTime: options.expirationTime,
      }),
    customFallback: options.fallback,
  });
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeWalletAuth(
  options: UnifiedWalletAuthOptions
): Promise<WalletAuthResult> {
  const eventManager = new EventManager();
  const stateManager = new MiniKitState();
  const ctx = { events: eventManager, state: stateManager };

  const syncCommand = createWalletAuthCommand(ctx);
  const asyncCommand = createWalletAuthAsyncCommand(ctx, syncCommand);

  const input: WalletAuthInput = {
    nonce: options.nonce,
    statement: options.statement,
    requestId: options.requestId,
    expirationTime: options.expirationTime,
    notBefore: options.notBefore,
  };

  const { finalPayload } = await asyncCommand(input);

  return normalizeNativeResult(finalPayload);
}

function normalizeNativeResult(payload: MiniAppWalletAuthPayload): WalletAuthResult {
  if (payload.status === 'error') {
    throw new WalletAuthError(payload.error_code, payload.details);
  }

  return {
    address: payload.address,
    message: payload.message,
    signature: payload.signature,
  };
}

// ============================================================================
// Errors
// ============================================================================

export class WalletAuthError extends Error {
  public readonly code: string;
  public readonly details?: string;

  constructor(code: string, details?: string) {
    super(details || `Wallet auth failed: ${code}`);
    this.name = 'WalletAuthError';
    this.code = code;
    this.details = details;
  }
}
