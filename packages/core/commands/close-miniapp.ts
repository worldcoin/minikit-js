import {
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  sendMiniKitEvent,
} from './types';

// ============================================================================
// Implementation
// ============================================================================

export function createCloseMiniAppCommand(_ctx: CommandContext) {
  return (): boolean => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.CloseMiniApp)
    ) {
      console.error(
        "'closeMiniApp' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return false;
    }

    sendMiniKitEvent({
      command: Command.CloseMiniApp,
      version: COMMAND_VERSIONS[Command.CloseMiniApp],
      payload: {},
    });

    return true;
  };
}
