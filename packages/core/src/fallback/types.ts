/**
 * Fallback system types for MiniKit commands
 *
 * The fallback system allows commands to gracefully degrade when:
 * 1. Running on web (not in World App)
 * 2. Running in an old World App version that doesn't support the command
 */

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
