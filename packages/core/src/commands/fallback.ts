/**
 * Fallback system for MiniKit commands
 *
 * Provides graceful degradation when commands are not available natively:
 * 1. Try native execution (World App)
 * 2. Try Wagmi fallback (web with Wagmi configured)
 * 3. Try custom fallback (user-provided)
 * 4. Throw error
 */

import type { CommandResult, CommandVia, FallbackReason } from './types';
import {
  CommandUnavailableError,
  FallbackRequiredError,
  isCommandAvailable,
  isInWorldApp,
} from './types';
import { hasWagmiConfig } from './wagmi-fallback';

export interface ExecuteWithFallbackOptions<TNative, TFallback = TNative> {
  /** Command name for availability checking */
  command: string;

  /** Native execution function (runs in World App) */
  nativeExecutor: () => Promise<TNative>;

  /** Wagmi fallback function (runs on web with Wagmi) */
  wagmiFallback?: () => Promise<TNative>;

  /** Custom fallback function (user-provided) */
  customFallback?: () => Promise<TFallback> | TFallback;

  /** If true, requires fallback on web (e.g., pay, getContacts) */
  requiresFallback?: boolean;
}

/**
 * Execute a command with fallback support
 *
 * @example
 * ```typescript
 * const result = await executeWithFallback({
 *   command: Command.WalletAuth,
 *   nativeExecutor: () => nativeWalletAuth(options),
 *   wagmiFallback: () => wagmiWalletAuth(options),
 *   customFallback: options.fallback,
 * });
 *
 * console.log(result.executedWith); // 'minikit' | 'wagmi' | 'fallback'
 * ```
 */
export async function executeWithFallback<TNative, TFallback = TNative>(
  options: ExecuteWithFallbackOptions<TNative, TFallback>,
): Promise<CommandResult<TNative | TFallback>> {
  const {
    command,
    nativeExecutor,
    wagmiFallback,
    customFallback,
    requiresFallback = false,
  } = options;

  // 1. Try native execution (World App)
  if (isInWorldApp() && isCommandAvailable(command)) {
    try {
      const data = await nativeExecutor();
      return { data, executedWith: 'minikit' as CommandVia };
    } catch (error) {
      // Native failed, fall through to fallbacks
      console.warn(`Native ${command} failed, attempting fallback:`, error);
    }
  }

  // 2. Try Wagmi fallback (web with Wagmi)
  if (wagmiFallback && hasWagmiConfig()) {
    try {
      const data = await wagmiFallback();
      return { data, executedWith: 'wagmi' as CommandVia };
    } catch (error) {
      console.warn(`Wagmi fallback for ${command} failed:`, error);
      // Fall through to custom fallback
    }
  }

  // 3. Try custom fallback
  if (customFallback) {
    const data = await customFallback();
    return { data, executedWith: 'fallback' as CommandVia };
  }

  // 4. Error - no fallback available
  if (requiresFallback && !isInWorldApp()) {
    throw new FallbackRequiredError(command);
  }

  throw new CommandUnavailableError(command, determineFallbackReason(command));
}

function determineFallbackReason(command: string): FallbackReason {
  if (!isInWorldApp()) {
    return 'notInWorldApp';
  }

  if (!isCommandAvailable(command)) {
    return 'oldAppVersion';
  }

  return 'commandNotSupported';
}
