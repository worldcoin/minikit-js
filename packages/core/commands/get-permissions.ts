import {
  Command,
  CommandContext,
  COMMAND_VERSIONS,
  isCommandAvailable,
  sendMiniKitEvent,
  ResponseEvent,
  AsyncHandlerReturn,
} from './types';

// ============================================================================
// Types
// ============================================================================

export type GetPermissionsInput = {};

export type GetPermissionsPayload = {
  status?: string;
};

export enum GetPermissionsErrorCodes {
  GenericError = 'generic_error',
}

export const GetPermissionsErrorMessage = {
  [GetPermissionsErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
};

export enum Permission {
  Notifications = 'notifications',
  Contacts = 'contacts',
  Microphone = 'microphone',
}

export type PermissionSettings = {
  [K in Permission]?: any;
};

export type MiniAppGetPermissionsSuccessPayload = {
  status: 'success';
  permissions: PermissionSettings;
  version: number;
  timestamp: string;
};

export type MiniAppGetPermissionsErrorPayload = {
  status: 'error';
  error_code: GetPermissionsErrorCodes;
  details: string;
  version: number;
};

export type MiniAppGetPermissionsPayload =
  | MiniAppGetPermissionsSuccessPayload
  | MiniAppGetPermissionsErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createGetPermissionsCommand(_ctx: CommandContext) {
  return (): GetPermissionsPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.GetPermissions)
    ) {
      console.error(
        "'getPermissions' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    sendMiniKitEvent({
      command: Command.GetPermissions,
      version: COMMAND_VERSIONS[Command.GetPermissions],
      payload: {},
    });

    return {
      status: 'sent',
    };
  };
}

export function createGetPermissionsAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createGetPermissionsCommand>,
) {
  return async (): AsyncHandlerReturn<
    GetPermissionsPayload | null,
    MiniAppGetPermissionsPayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: GetPermissionsPayload | null = null;

        const handleResponse = (payload: MiniAppGetPermissionsPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppGetPermissions);
          resolve({ commandPayload, finalPayload: payload });
        };

        ctx.events.subscribe(ResponseEvent.MiniAppGetPermissions, handleResponse as any);
        commandPayload = syncCommand();
      } catch (error) {
        reject(error);
      }
    });
  };
}
