import type {
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

export type ChatInput = {
  to?: string[];
  message: string;
};

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
