import {
  AsyncHandlerReturn,
  Command,
  COMMAND_VERSIONS,
  CommandContext,
  isCommandAvailable,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
  ResponseEvent,
  sendMiniKitEvent,
} from './types';

// ============================================================================
// Types
// ============================================================================

export type ShareContactsInput = {
  isMultiSelectEnabled: boolean;
  inviteMessage?: string;
};

export type ShareContactsPayload = ShareContactsInput;

export enum ShareContactsErrorCodes {
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export const ShareContactsErrorMessage = {
  [ShareContactsErrorCodes.UserRejected]: 'User rejected the request.',
  [ShareContactsErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export type Contact = {
  username: string;
  walletAddress: string;
  profilePictureUrl: string | null;
};

export type MiniAppShareContactsSuccessPayload = MiniAppBaseSuccessPayload & {
  contacts: Contact[];
  timestamp: string;
};

export type MiniAppShareContactsErrorPayload =
  MiniAppBaseErrorPayload<ShareContactsErrorCodes>;

export type MiniAppShareContactsPayload =
  | MiniAppShareContactsSuccessPayload
  | MiniAppShareContactsErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createShareContactsCommand(_ctx: CommandContext) {
  return (payload: ShareContactsPayload): ShareContactsPayload | null => {
    if (
      typeof window === 'undefined' ||
      !isCommandAvailable(Command.ShareContacts)
    ) {
      console.error(
        "'shareContacts' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    sendMiniKitEvent({
      command: Command.ShareContacts,
      version: COMMAND_VERSIONS[Command.ShareContacts],
      payload,
    });

    return payload;
  };
}

export function createShareContactsAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createShareContactsCommand>,
) {
  return async (
    payload: ShareContactsPayload,
  ): AsyncHandlerReturn<
    ShareContactsPayload | null,
    MiniAppShareContactsPayload
  > => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: ShareContactsPayload | null = null;

        const handleResponse = (response: MiniAppShareContactsPayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppShareContacts);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(
          ResponseEvent.MiniAppShareContacts,
          handleResponse as any,
        );
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
