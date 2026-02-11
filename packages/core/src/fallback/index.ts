/**
 * Fallback system for MiniKit commands
 *
 * Provides graceful degradation when commands are not available natively:
 * 1. Try native execution (World App)
 * 2. Try Wagmi fallback (web with Wagmi configured)
 * 3. Try custom fallback (user-provided)
 * 4. Throw error
 */

export * from './types';
export * from './wagmi';

import { isCommandAvailable } from '../../commands/types';
import {
  CommandResult,
  CommandVia,
  CommandUnavailableError,
  FallbackRequiredError,
  FallbackReason,
} from './types';
import { hasWagmiConfig } from './wagmi';

/**
 * Check if running inside World App
 */
export function isInWorldApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.WorldApp);
}

export interface ExecuteWithFallbackOptions<T> {
  /** Command name for availability checking */
  command: string;

  /** Native execution function (runs in World App) */
  nativeExecutor: () => Promise<T>;

  /** Wagmi fallback function (runs on web with Wagmi) */
  wagmiFallback?: () => Promise<T>;

  /** Custom fallback function (user-provided) */
  customFallback?: () => Promise<T> | T;

  /** If true, requires fallback on web (e.g., pay, getContacts) */
  requiresFallback?: boolean;
}

/**
 * Execute a command with fallback support
 *
 * @example
 * ```typescript
 * const result = await executeWithFallback({
 *   command: 'walletAuth',
 *   nativeExecutor: () => nativeWalletAuth(options),
 *   wagmiFallback: () => wagmiWalletAuth(options),
 *   customFallback: options.fallback,
 * });
 *
 * console.log(result.via); // 'minikit' | 'wagmi' | 'fallback'
 * ```
 */
export async function executeWithFallback<T>(
  options: ExecuteWithFallbackOptions<T>
): Promise<CommandResult<T>> {
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
      return { data, via: 'minikit' as CommandVia };
    } catch (error) {
      // Native failed, fall through to fallbacks
      console.warn(`Native ${command} failed, attempting fallback:`, error);
    }
  }

  // 2. Try Wagmi fallback (web with Wagmi)
  if (wagmiFallback && hasWagmiConfig()) {
    try {
      const data = await wagmiFallback();
      return { data, via: 'wagmi' as CommandVia };
    } catch (error) {
      console.warn(`Wagmi fallback for ${command} failed:`, error);
      // Fall through to custom fallback
    }
  }

  // 3. Try custom fallback
  if (customFallback) {
    const data = await customFallback();
    return { data, via: 'fallback' as CommandVia };
  }

  // 4. Error - no fallback available
  if (requiresFallback && !isInWorldApp()) {
    throw new FallbackRequiredError(command);
  }

  throw new CommandUnavailableError(command, determineFallbackReason(command));
}

/**
 * Determine why the fallback was triggered
 */
function determineFallbackReason(command: string): FallbackReason {
  if (!isInWorldApp()) {
    return 'not_in_world_app';
  }

  if (!isCommandAvailable(command)) {
    return 'old_app_version';
  }

  return 'command_not_supported';
}
