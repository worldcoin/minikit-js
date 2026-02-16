import type {
  FallbackConfig,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

type ChatParams = {
  to?: string[];
  message: string;
};

/** @deprecated Use {@link MiniKitChatOptions} instead */
export type ChatInput = ChatParams;

export interface MiniKitChatOptions<TCustomFallback = MiniAppChatPayload>
  extends ChatParams,
    FallbackConfig<TCustomFallback> {}

export enum ChatErrorCodes {
  UserRejected = 'user_rejected',
  SendFailed = 'send_failed',
  GenericError = 'generic_error',
}

export type MiniAppChatSuccessPayload = MiniAppBaseSuccessPayload & {
  count: number;
  timestamp: string;
};

export type MiniAppChatErrorPayload = MiniAppBaseErrorPayload<ChatErrorCodes>;

export type MiniAppChatPayload =
  | MiniAppChatSuccessPayload
  | MiniAppChatErrorPayload;

export class ChatError extends Error {
  constructor(public readonly error_code: ChatErrorCodes) {
    super(`Chat failed: ${error_code}`);
    this.name = 'ChatError';
  }
}
