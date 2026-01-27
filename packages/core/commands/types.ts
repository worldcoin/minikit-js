import { EventManager } from '../core/events';
import { MiniKitState } from '../core/state';
import { sendWebviewEvent } from '../helpers/send-webview-event';

// ============================================================================
// Enums
// ============================================================================

export enum Command {
  Verify = 'verify',
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
  MiniAppVerifyAction = 'miniapp-verify-action',
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

// ============================================================================
// Command Versions & Availability
// ============================================================================

export const COMMAND_VERSIONS: Record<Command, number> = {
  [Command.Verify]: 1,
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
  [Command.Verify]: false,
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

export function isCommandAvailable(command: Command): boolean {
  return commandAvailability[command];
}

export function setCommandAvailable(command: Command, available: boolean): void {
  commandAvailability[command] = available;
}

export function validateCommands(
  worldAppSupportedCommands: NonNullable<typeof window.WorldApp>['supported_commands'],
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
// Shared Types
// ============================================================================

export interface CommandContext {
  events: EventManager;
  state: MiniKitState;
}

export type AsyncHandlerReturn<CommandPayload, FinalPayload> = Promise<{
  commandPayload: CommandPayload;
  finalPayload: FinalPayload;
}>;

export type WebViewBasePayload = {
  command: Command;
  version: number;
  payload: Record<string, any>;
};

// Import error types for MiniKitInstallReturnType
import {
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from '../types/errors';

export type MiniKitInstallReturnType =
  | { success: true }
  | {
      success: false;
      errorCode: MiniKitInstallErrorCodes;
      errorMessage: (typeof MiniKitInstallErrorMessage)[MiniKitInstallErrorCodes];
    };

// ============================================================================
// Shared Helpers
// ============================================================================

export function sendMiniKitEvent<T extends WebViewBasePayload = WebViewBasePayload>(
  payload: T,
): void {
  sendWebviewEvent(payload);
}
