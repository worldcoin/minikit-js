import { Command } from 'types/commands';

import { MINI_KIT_COMMAND_VERSION } from './constants';
import { setCommandAvailability } from './state';

type SupportedCommands = NonNullable<typeof window.WorldApp>['supported_commands'];

export const syncCommandAvailability = (supportedCommands: SupportedCommands) => {
  let allCommandsValid = true;

  (Object.entries(MINI_KIT_COMMAND_VERSION) as Array<[Command, number]>).forEach(
    ([miniKitCommandName, version]) => {
      const commandInput = supportedCommands.find(
        (command) => command.name === miniKitCommandName,
      );

      let isCommandValid = false;

      if (!commandInput) {
        console.warn(
          `Command ${miniKitCommandName} is not supported by the app. Try updating the app version`,
        );
      } else if (commandInput.supported_versions.includes(version)) {
        // TODO: add proper support for multiple versions
        isCommandValid = true;
      } else {
        // For now we will allow the command to be used but we should warn the developer and add granular support for each version
        isCommandValid = true;
        console.warn(
          `Command ${miniKitCommandName} version ${version} is not supported by the app. Supported versions: ${commandInput.supported_versions.join(', ')}. This is not an error, but it is recommended to update the World App version.`,
        );
      }

      setCommandAvailability(miniKitCommandName, isCommandValid);

      if (!isCommandValid) {
        allCommandsValid = false;
      }
    },
  );

  return allCommandsValid;
};
