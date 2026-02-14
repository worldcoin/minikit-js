import { generateSiweMessage } from './siwe';
import { validateWalletAuthCommandInput } from './validate';
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
import { wagmiWalletAuth } from '../wagmi-fallback';
import { EventManager } from '../../events';

export * from './types';
import type {
  WalletAuthInput,
  UnifiedWalletAuthOptions,
  WalletAuthResult,
  MiniAppWalletAuthPayload,
} from './types';
import { WalletAuthError } from './types';

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
  options: UnifiedWalletAuthOptions,
  ctx?: CommandContext,
): Promise<CommandResult<WalletAuthResult>> {
  return executeWithFallback({
    command: Command.WalletAuth,
    nativeExecutor: () => nativeWalletAuth(options, ctx),
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
  options: UnifiedWalletAuthOptions,
  ctx?: CommandContext,
): Promise<WalletAuthResult> {
  if (!ctx) {
    ctx = { events: new EventManager(), state: { deviceProperties: {} } };
  }

  if (
    typeof window === 'undefined' ||
    !isCommandAvailable(Command.WalletAuth)
  ) {
    throw new Error(
      "'walletAuth' command is unavailable. Check MiniKit.install() or update the app version",
    );
  }

  const input: WalletAuthInput = {
    nonce: options.nonce,
    statement: options.statement,
    requestId: options.requestId,
    expirationTime: options.expirationTime,
    notBefore: options.notBefore,
  };

  const validationResult = validateWalletAuthCommandInput(input);
  if (!validationResult.valid) {
    throw new Error(`Invalid wallet auth input: ${validationResult.message}`);
  }

  let protocol: string;
  try {
    const currentUrl = new URL(window.location.href);
    protocol = currentUrl.protocol.split(':')[0];
  } catch (error) {
    throw new Error('Failed to get current URL');
  }

  const siweMessage = generateSiweMessage({
    scheme: protocol,
    domain: window.location.host,
    statement: input.statement ?? undefined,
    uri: window.location.href,
    version: '1',
    chain_id: 480,
    nonce: input.nonce,
    issued_at: new Date().toISOString(),
    expiration_time: input.expirationTime?.toISOString() ?? undefined,
    not_before: input.notBefore?.toISOString() ?? undefined,
    request_id: input.requestId ?? undefined,
  });

  const walletAuthPayload = { siweMessage };

  // Wallet auth version 2 is only available for world app version 2087900 and above
  const worldAppVersion = ctx.state.deviceProperties.worldAppVersion;
  const walletAuthVersion =
    worldAppVersion && worldAppVersion > 2087900
      ? COMMAND_VERSIONS[Command.WalletAuth]
      : 1;

  const finalPayload = await new Promise<MiniAppWalletAuthPayload>(
    (resolve, reject) => {
      try {
        ctx!.events.subscribe(
          ResponseEvent.MiniAppWalletAuth,
          ((response: MiniAppWalletAuthPayload) => {
            ctx!.events.unsubscribe(ResponseEvent.MiniAppWalletAuth);
            resolve(response);
          }) as any,
        );

        sendMiniKitEvent({
          command: Command.WalletAuth,
          version: walletAuthVersion,
          payload: walletAuthPayload,
        });
      } catch (error) {
        reject(error);
      }
    },
  );

  if (finalPayload.status === 'error') {
    throw new WalletAuthError(finalPayload.error_code, finalPayload.details);
  }

  return {
    address: finalPayload.address,
    message: finalPayload.message,
    signature: finalPayload.signature,
  };
}
