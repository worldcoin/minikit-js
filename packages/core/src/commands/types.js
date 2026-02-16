// ============================================================================
// Command Registry — update these when adding a new command
// ============================================================================
export var Command;
(function (Command) {
  Command['Pay'] = 'pay';
  Command['WalletAuth'] = 'wallet-auth';
  Command['SendTransaction'] = 'send-transaction';
  Command['SignMessage'] = 'sign-message';
  Command['SignTypedData'] = 'sign-typed-data';
  Command['ShareContacts'] = 'share-contacts';
  Command['RequestPermission'] = 'request-permission';
  Command['GetPermissions'] = 'get-permissions';
  Command['SendHapticFeedback'] = 'send-haptic-feedback';
  Command['Share'] = 'share';
  Command['Chat'] = 'chat';
})(Command || (Command = {}));
export var ResponseEvent;
(function (ResponseEvent) {
  ResponseEvent['MiniAppPayment'] = 'miniapp-payment';
  ResponseEvent['MiniAppWalletAuth'] = 'miniapp-wallet-auth';
  ResponseEvent['MiniAppSendTransaction'] = 'miniapp-send-transaction';
  ResponseEvent['MiniAppSignMessage'] = 'miniapp-sign-message';
  ResponseEvent['MiniAppSignTypedData'] = 'miniapp-sign-typed-data';
  ResponseEvent['MiniAppShareContacts'] = 'miniapp-share-contacts';
  ResponseEvent['MiniAppRequestPermission'] = 'miniapp-request-permission';
  ResponseEvent['MiniAppGetPermissions'] = 'miniapp-get-permissions';
  ResponseEvent['MiniAppSendHapticFeedback'] = 'miniapp-send-haptic-feedback';
  ResponseEvent['MiniAppShare'] = 'miniapp-share';
  ResponseEvent['MiniAppMicrophone'] = 'miniapp-microphone';
  ResponseEvent['MiniAppChat'] = 'miniapp-chat';
})(ResponseEvent || (ResponseEvent = {}));
export const COMMAND_VERSIONS = {
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
const commandAvailability = {
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
export function isCommandAvailable(command) {
  return commandAvailability[command] ?? false;
}
export function setCommandAvailable(command, available) {
  commandAvailability[command] = available;
}
export function validateCommands(worldAppSupportedCommands) {
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
        setCommandAvailable(commandName, true);
        isCommandValid = true;
      } else {
        isCommandValid = true;
        console.warn(
          `Command ${commandName} version ${version} is not supported by the app. Supported versions: ${commandInput.supported_versions.join(', ')}. This is not an error, but it is recommended to update the World App version.`,
        );
        setCommandAvailable(commandName, true);
      }
    }
    if (!isCommandValid) {
      allCommandsValid = false;
    }
  });
  return allCommandsValid;
}
export function sendMiniKitEvent(payload) {
  if (window.webkit) {
    window.webkit?.messageHandlers?.minikit?.postMessage?.(payload);
  } else if (window.Android) {
    window.Android?.postMessage?.(JSON.stringify(payload));
  }
}
// ============================================================================
// Unified API — result types, fallback, and environment detection
// ============================================================================
export function isInWorldApp() {
  return typeof window !== 'undefined' && Boolean(window.WorldApp);
}
export class FallbackRequiredError extends Error {
  constructor(command) {
    super(
      `${command} requires a fallback function when running outside World App. ` +
        `Provide a fallback option: MiniKit.${command}({ ..., fallback: () => yourFallback() })`,
    );
    this.name = 'FallbackRequiredError';
  }
}
export class CommandUnavailableError extends Error {
  constructor(command, reason) {
    const messages = {
      notInWorldApp: 'Not running inside World App',
      commandNotSupported: 'Command not supported in this environment',
      oldAppVersion: 'World App version does not support this command',
    };
    super(`${command} is unavailable: ${messages[reason]}`);
    this.name = 'CommandUnavailableError';
    this.reason = reason;
  }
}
