import { generateSiweMessage } from '../../helpers/siwe';
import { validateWalletAuthCommandInput } from './validate';
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
import { wagmiWalletAuth } from '../fallback-wagmi';
import type { CommandResult, FallbackConfig } from '../fallback';
import { EventManager } from '../../events';
import { MiniKitState } from '../../state';

// ============================================================================
// Types
// ============================================================================

export type WalletAuthInput = {
  nonce: string;
  statement?: string;
  requestId?: string;
  expirationTime?: Date;
  notBefore?: Date;
};

export type WalletAuthPayload = {
  siweMessage: string;
};

export enum WalletAuthErrorCodes {
  MalformedRequest = 'malformed_request',
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export const WalletAuthErrorMessage = {
  [WalletAuthErrorCodes.MalformedRequest]:
    'Provided parameters in the request are invalid.',
  [WalletAuthErrorCodes.UserRejected]: 'User rejected the request.',
  [WalletAuthErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export type MiniAppWalletAuthSuccessPayload = MiniAppBaseSuccessPayload & {
  message: string;
  signature: string;
  address: string;
};

export type MiniAppWalletAuthErrorPayload =
  MiniAppBaseErrorPayload<WalletAuthErrorCodes> & {
    details: (typeof WalletAuthErrorMessage)[WalletAuthErrorCodes];
  };

export type MiniAppWalletAuthPayload =
  | MiniAppWalletAuthSuccessPayload
  | MiniAppWalletAuthErrorPayload;

// ============================================================================
// Unified API Types
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
// Native Command Implementation
// ============================================================================

export function createWalletAuthCommand(ctx: CommandContext) {
  return (payload: WalletAuthInput): WalletAuthPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.WalletAuth)
    ) {
      console.error(
        "'walletAuth' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    const validationResult = validateWalletAuthCommandInput(payload);

    if (!validationResult.valid) {
      console.error(
        'Failed to validate wallet auth input:\n\n -->',
        validationResult.message,
      );
      return null;
    }

    let protocol: string | null = null;

    try {
      const currentUrl = new URL(window.location.href);
      protocol = currentUrl.protocol.split(':')[0];
    } catch (error) {
      console.error('Failed to get current URL', error);
      return null;
    }

    const siweMessage = generateSiweMessage({
      scheme: protocol,
      domain: window.location.host,
      statement: payload.statement ?? undefined,
      uri: window.location.href,
      version: '1',
      chain_id: 480,
      nonce: payload.nonce,
      issued_at: new Date().toISOString(),
      expiration_time: payload.expirationTime?.toISOString() ?? undefined,
      not_before: payload.notBefore?.toISOString() ?? undefined,
      request_id: payload.requestId ?? undefined,
    });

    const walletAuthPayload = { siweMessage };

    // Wallet auth version 2 is only available for world app version 2087900 and above
    const walletAuthVersion =
      ctx.state.user.worldAppVersion && ctx.state.user.worldAppVersion > 2087900
        ? COMMAND_VERSIONS[Command.WalletAuth]
        : 1;

    sendMiniKitEvent({
      command: Command.WalletAuth,
      version: walletAuthVersion,
      payload: walletAuthPayload,
    });

    return walletAuthPayload;
  };
}

export function createWalletAuthAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createWalletAuthCommand>,
) {
  return async (
    payload: WalletAuthInput,
  ): AsyncHandlerReturn<WalletAuthPayload | null, MiniAppWalletAuthPayload> => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: WalletAuthPayload | null = null;

        const handleResponse = async (response: MiniAppWalletAuthPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppWalletAuth);

          // Update user state on successful auth
          if (response.status === 'success') {
            await ctx.state.updateUserFromWalletAuth(response.address);
          }

          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppWalletAuth,
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
