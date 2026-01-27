import {
  Command,
  CommandContext,
  COMMAND_VERSIONS,
  isCommandAvailable,
  sendMiniKitEvent,
  ResponseEvent,
  AsyncHandlerReturn,
} from './types';
import { Permission } from './get-permissions';

// ============================================================================
// Types
// ============================================================================

export type RequestPermissionInput = {
  permission: Permission;
};

export type RequestPermissionPayload = RequestPermissionInput;

export enum RequestPermissionErrorCodes {
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
  AlreadyRequested = 'already_requested',
  PermissionDisabled = 'permission_disabled',
  AlreadyGranted = 'already_granted',
  UnsupportedPermission = 'unsupported_permission',
}

export const RequestPermissionErrorMessage = {
  [RequestPermissionErrorCodes.UserRejected]: 'User declined sharing contacts',
  [RequestPermissionErrorCodes.GenericError]: 'Request failed for unknown reason.',
  [RequestPermissionErrorCodes.AlreadyRequested]:
    'User has already declined turning on notifications once',
  [RequestPermissionErrorCodes.PermissionDisabled]:
    'User does not have this permission enabled in World App',
  [RequestPermissionErrorCodes.AlreadyGranted]:
    'If the user has already granted this mini app permission',
  [RequestPermissionErrorCodes.UnsupportedPermission]:
    'The permission requested is not supported by this mini app',
};

export type MiniAppRequestPermissionSuccessPayload = {
  status: 'success';
  permission: Permission;
  timestamp: string;
  version: number;
};

export type MiniAppRequestPermissionErrorPayload = {
  status: 'error';
  error_code: RequestPermissionErrorCodes;
  description: string;
  version: number;
};

export type MiniAppRequestPermissionPayload =
  | MiniAppRequestPermissionSuccessPayload
  | MiniAppRequestPermissionErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createRequestPermissionCommand(_ctx: CommandContext) {
  return (payload: RequestPermissionInput): RequestPermissionPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.RequestPermission)
    ) {
      console.error(
        "'requestPermission' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    sendMiniKitEvent({
      command: Command.RequestPermission,
      version: COMMAND_VERSIONS[Command.RequestPermission],
      payload,
    });

    return payload;
  };
}

export function createRequestPermissionAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createRequestPermissionCommand>,
) {
  return async (
    payload: RequestPermissionInput,
  ): AsyncHandlerReturn<
    RequestPermissionPayload | null,
    MiniAppRequestPermissionPayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: RequestPermissionPayload | null = null;

        const handleResponse = (response: MiniAppRequestPermissionPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppRequestPermission);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(ResponseEvent.MiniAppRequestPermission, handleResponse as any);
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
