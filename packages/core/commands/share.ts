import { formatShareInput } from '../helpers/share';
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

export type ShareInput = {
  files?: File[];
  title?: string;
  text?: string;
  url?: string;
};

export type SharePayload = {
  files?: Array<{
    name: string;
    type: string;
    data: string;
  }>;
  title?: string;
  text?: string;
  url?: string;
};

export enum ShareFilesErrorCodes {
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
  InvalidFileName = 'invalid_file_name',
}

export const ShareFilesErrorMessage = {
  [ShareFilesErrorCodes.UserRejected]: 'User rejected the request.',
  [ShareFilesErrorCodes.GenericError]: 'Something unexpected went wrong.',
  [ShareFilesErrorCodes.InvalidFileName]:
    'Invalid file name. Make sure you include the extension',
};

export type MiniAppShareSuccessPayload = MiniAppBaseSuccessPayload & {
  shared_files_count: number;
  timestamp: string;
};

export type MiniAppShareErrorPayload =
  MiniAppBaseErrorPayload<ShareFilesErrorCodes>;

export type MiniAppSharePayload =
  | MiniAppShareSuccessPayload
  | MiniAppShareErrorPayload;

// ============================================================================
// Implementation
// ============================================================================

export function createShareCommand(ctx: CommandContext) {
  return (payload: ShareInput): ShareInput | null => {
    if (typeof window === 'undefined' || !isCommandAvailable(Command.Share)) {
      console.error(
        "'share' command is unavailable. Check MiniKit.install() or update the app version",
      );
      return null;
    }

    if (
      ctx.state.deviceProperties.deviceOS === 'ios' &&
      typeof navigator !== 'undefined'
    ) {
      // Send the payload to the World App for Analytics
      sendMiniKitEvent({
        command: Command.Share,
        version: COMMAND_VERSIONS[Command.Share],
        payload: payload,
      });
      navigator.share(payload);
    } else {
      // Only for android
      formatShareInput(payload)
        .then((formattedResult: SharePayload) => {
          sendMiniKitEvent({
            command: Command.Share,
            version: COMMAND_VERSIONS[Command.Share],
            payload: formattedResult,
          });
        })
        .catch((error) => {
          console.error('Failed to format share input', error);
        });

      ctx.events.subscribe(ResponseEvent.MiniAppShare, (response) => {
        console.log('Share Response', response);
      });
    }

    return payload;
  };
}

export function createShareAsyncCommand(
  ctx: CommandContext,
  syncCommand: ReturnType<typeof createShareCommand>,
) {
  return async (
    payload: ShareInput,
  ): AsyncHandlerReturn<ShareInput | null, MiniAppSharePayload> => {
    return new Promise((resolve, reject) => {
      try {
        let commandPayload: ShareInput | null = null;

        const handleResponse = (response: MiniAppSharePayload) => {
          ctx.events.unsubscribe(ResponseEvent.MiniAppShare);
          resolve({ commandPayload, finalPayload: response });
        };

        ctx.events.subscribe(ResponseEvent.MiniAppShare, handleResponse as any);
        commandPayload = syncCommand(payload);
      } catch (error) {
        reject(error);
      }
    });
  };
}
