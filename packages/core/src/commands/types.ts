import { EventManager } from '../events';
import type { DeviceProperties } from '../types';

// ============================================================================
// Command Registry — update these when adding a new command
// ============================================================================

export enum Command {
  Pay = 'pay',
  WalletAuth = 'wallet-auth',
  SendTransaction = 'send-transaction',
  SignMessage = 'sign-message',
  SignTypedData = 'sign-typed-data',
  ShareContacts = 'share-contacts',
  RequestPermission = 'request-permission',
  GetPermissions = 'get-permissions',
  SendHapticFeedback = 'send-haptic-feedback',
  Share = 'share',
  Chat = 'chat',
}

export enum ResponseEvent {
  MiniAppPayment = 'miniapp-payment',
  MiniAppWalletAuth = 'miniapp-wallet-auth',
  MiniAppSendTransaction = 'miniapp-send-transaction',
  MiniAppSignMessage = 'miniapp-sign-message',
  MiniAppSignTypedData = 'miniapp-sign-typed-data',
  MiniAppShareContacts = 'miniapp-share-contacts',
  MiniAppRequestPermission = 'miniapp-request-permission',
  MiniAppGetPermissions = 'miniapp-get-permissions',
  MiniAppSendHapticFeedback = 'miniapp-send-haptic-feedback',
  MiniAppShare = 'miniapp-share',
  MiniAppMicrophone = 'miniapp-microphone',
  MiniAppChat = 'miniapp-chat',
}

export const COMMAND_VERSIONS: Record<Command, number> = {
  [Command.Pay]: 1,
  [Command.WalletAuth]: 2,
  [Command.SendTransaction]: 1,
  [Command.SignMessage]: 1,
  [Command.SignTypedData]: 1,
  [Command.ShareContacts]: 1,
  [Command.RequestPermission]: 1,
  [Command.GetPermissions]: 1,
  [Command.SendHapticFeedback]: 1,
  [Command.Share]: 1,
  [Command.Chat]: 1,
};

const commandAvailability: Record<Command, boolean> = {
  [Command.Pay]: false,
  [Command.WalletAuth]: false,
  [Command.SendTransaction]: false,
  [Command.SignMessage]: false,
  [Command.SignTypedData]: false,
  [Command.ShareContacts]: false,
  [Command.RequestPermission]: false,
  [Command.GetPermissions]: false,
  [Command.SendHapticFeedback]: false,
  [Command.Share]: false,
  [Command.Chat]: false,
};

export function isCommandAvailable(command: Command | string): boolean {
  return commandAvailability[command as Command] ?? false;
}

export function setCommandAvailable(
  command: Command,
  available: boolean,
): void {
  commandAvailability[command] = available;
}

export function validateCommands(
  worldAppSupportedCommands: NonNullable<
    typeof window.WorldApp
  >['supported_commands'],
): boolean {
  let allCommandsValid = true;

  Object.entries(COMMAND_VERSIONS).forEach(([commandName, version]) => {
    const commandInput = worldAppSupportedCommands.find(
      (cmd) => cmd.name === commandName,
    );

    let isCommandValid = false;

    if (!commandInput) {
      console.warn(
        `Command ${commandName} is not supported by the app. Try updating the app version`,
      );
    } else {
      if (commandInput.supported_versions.includes(version)) {
        setCommandAvailable(commandName as Command, true);
        isCommandValid = true;
      } else {
        isCommandValid = true;
        console.warn(
          `Command ${commandName} version ${version} is not supported by the app. Supported versions: ${commandInput.supported_versions.join(', ')}. This is not an error, but it is recommended to update the World App version.`,
        );
        setCommandAvailable(commandName as Command, true);
      }
    }

    if (!isCommandValid) {
      allCommandsValid = false;
    }
  });

  return allCommandsValid;
}

// ============================================================================
// Command Infrastructure — base types for implementing commands
// ============================================================================

export interface CommandState {
  deviceProperties: DeviceProperties;
}

export interface CommandContext {
  events: EventManager;
  state: CommandState;
}

export type WebViewBasePayload = {
  command: Command;
  version: number;
  payload: Record<string, any>;
};

export function sendMiniKitEvent<T extends Record<string, any>>(
  payload: T,
): void {
  if (window.webkit) {
    window.webkit?.messageHandlers?.minikit?.postMessage?.(payload);
  } else if (window.Android) {
    window.Android?.postMessage?.(JSON.stringify(payload));
  }
}

export type MiniAppBaseSuccessPayload = {
  status: 'success';
  version: number;
};

export type MiniAppBaseErrorPayload<TErrorCode = string> = {
  status: 'error';
  error_code: TErrorCode;
  version: number;
};

// ============================================================================
// Unified API — result types, fallback, and environment detection
// ============================================================================

export function isInWorldApp(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).WorldApp);
}

export type CommandVia = 'minikit' | 'wagmi' | 'fallback';

export interface CommandResult<T> {
  data: T;
  via: CommandVia;
}

export type CommandResultByVia<
  TNative,
  TFallback = TNative,
  TViaNative extends CommandVia = Exclude<CommandVia, 'fallback'>,
> =
  | {
      via: TViaNative;
      data: TNative;
    }
  | {
      via: 'fallback';
      data: TFallback;
    };

export interface FallbackConfig<TFallback = unknown> {
  /**
   * Optional custom fallback executor.
   * The fallback return type can differ from the native/Wagmi success payload.
   */
  fallback?: () => Promise<TFallback> | TFallback;
}

export type FallbackReason =
  | 'notInWorldApp'
  | 'commandNotSupported'
  | 'oldAppVersion';

export class FallbackRequiredError extends Error {
  constructor(command: string) {
    super(
      `${command} requires a fallback function when running outside World App. ` +
        `Provide a fallback option: MiniKit.${command}({ ..., fallback: () => yourFallback() })`,
    );
    this.name = 'FallbackRequiredError';
  }
}

export class CommandUnavailableError extends Error {
  public readonly reason: FallbackReason;

  constructor(command: string, reason: FallbackReason) {
    const messages: Record<FallbackReason, string> = {
      notInWorldApp: 'Not running inside World App',
      commandNotSupported: 'Command not supported in this environment',
      oldAppVersion: 'World App version does not support this command',
    };

    super(`${command} is unavailable: ${messages[reason]}`);
    this.name = 'CommandUnavailableError';
    this.reason = reason;
  }
}
