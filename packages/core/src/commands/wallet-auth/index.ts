import { EventManager } from '../../events';
import { executeWithFallback } from '../fallback';
import type { CommandResultByVia } from '../types';
import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  ResponseEvent,
  sendMiniKitEvent,
} from '../types';
import { wagmiWalletAuth } from '../wagmi-fallback';
import { generateSiweMessage } from './siwe';
import type {
  MiniAppWalletAuthPayload,
  MiniKitWalletAuthOptions,
  WalletAuthInput,
  WalletAuthResult,
} from './types';
import { WalletAuthError } from './types';
import { validateWalletAuthCommandInput } from './validate';

export * from './types';

// ============================================================================
// Unified API (auto-detects environment)
// ============================================================================

/**
 * Authenticate user via wallet signature (SIWE)
 *
 * @example
 * ```typescript
 * // Basic usage - works in World App and web
 * const result = await walletAuth({ nonce: 'randomnonce123' });
 * console.log(result.data.address); // '0x...'
 * console.log(result.executedWith); // 'minikit' | 'wagmi' | 'fallback'
 *
 * // With custom fallback
 * const result = await walletAuth({
 *   nonce: 'randomnonce123',
 *   fallback: () => signInWithOAuth(),
 * });
 * ```
 */
export async function walletAuth<TFallback = WalletAuthResult>(
  options: MiniKitWalletAuthOptions<TFallback>,
  ctx?: CommandContext,
): Promise<CommandResultByVia<WalletAuthResult, TFallback>> {
  const result = await executeWithFallback({
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

  if (result.executedWith === 'fallback') {
    return { executedWith: 'fallback', data: result.data as TFallback };
  }

  if (result.executedWith === 'wagmi') {
    return { executedWith: 'wagmi', data: result.data as WalletAuthResult };
  }

  return { executedWith: 'minikit', data: result.data as WalletAuthResult };
}

// ============================================================================
// Native Implementation (World App)
// ============================================================================

async function nativeWalletAuth(
  options: MiniKitWalletAuthOptions<any>,
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
        ctx!.events.subscribe(ResponseEvent.MiniAppWalletAuth, ((
          response: MiniAppWalletAuthPayload,
        ) => {
          ctx!.events.unsubscribe(ResponseEvent.MiniAppWalletAuth);
          resolve(response);
        }) as any);

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
