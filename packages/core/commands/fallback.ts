/**
 * Fallback system for MiniKit commands
 *
 * Provides graceful degradation when commands are not available natively:
 * 1. Try native execution (World App)
 * 2. Try Wagmi fallback (web with Wagmi configured)
 * 3. Try custom fallback (user-provided)
 * 4. Throw error
 */

import { isCommandAvailable } from './types';
import { hasWagmiConfig } from './fallback-wagmi';

// ============================================================================
// Types
// ============================================================================

/**
 * Indicates which execution path was used for a command
 */
export type CommandVia = 'minikit' | 'wagmi' | 'fallback';

/**
 * Result wrapper that includes the execution path
 */
export interface CommandResult<T> {
  /** The command result data */
  data: T;
  /** Which execution path was used */
  via: CommandVia;
}

/**
 * Configuration for custom fallback behavior
 */
export interface FallbackConfig<T> {
  /**
   * Custom fallback function to execute when native and Wagmi fallbacks are unavailable.
   * For commands like `pay` and `getContacts`, this is required on web.
   */
  fallback?: () => Promise<T> | T;
}

/**
 * Reason why fallback was triggered
 */
export type FallbackReason =
  | 'not_in_world_app'
  | 'command_not_supported'
  | 'old_app_version';

/**
 * Error thrown when a command requires a fallback but none was provided
 */
export class FallbackRequiredError extends Error {
  constructor(command: string) {
    super(
      `${command} requires a fallback function when running outside World App. ` +
        `Provide a fallback option: MiniKit.${command}({ ..., fallback: () => yourFallback() })`
    );
    this.name = 'FallbackRequiredError';
  }
}

/**
 * Error thrown when a command is unavailable and no fallback exists
 */
export class CommandUnavailableError extends Error {
  public readonly reason: FallbackReason;

  constructor(command: string, reason: FallbackReason) {
    const messages: Record<FallbackReason, string> = {
      not_in_world_app: 'Not running inside World App',
      command_not_supported: 'Command not supported in this environment',
      old_app_version: 'World App version does not support this command',
    };

    super(`${command} is unavailable: ${messages[reason]}`);
    this.name = 'CommandUnavailableError';
    this.reason = reason;
  }
}

// ============================================================================
// Implementation
// ============================================================================

/** Check if running inside World App */
function isInWorldApp(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).WorldApp);
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
  options: ExecuteWithFallbackOptions<T>,
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
