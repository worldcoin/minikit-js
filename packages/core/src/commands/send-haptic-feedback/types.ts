import type {
  FallbackConfig,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

type SendHapticFeedbackParams =
  | {
      hapticsType: 'notification';
      style: 'error' | 'success' | 'warning';
    }
  | {
      hapticsType: 'selection-changed';
      style?: never;
    }
  | {
      hapticsType: 'impact';
      style: 'light' | 'medium' | 'heavy';
    };

/** @deprecated Use {@link SendHapticFeedbackOptions} instead */
export type SendHapticFeedbackInput = SendHapticFeedbackParams;

export enum SendHapticFeedbackErrorCodes {
  GenericError = 'generic_error',
  UserRejected = 'user_rejected',
}

export type MiniAppSendHapticFeedbackSuccessPayload =
  MiniAppBaseSuccessPayload & {
    timestamp: string;
  };

export type MiniAppSendHapticFeedbackErrorPayload =
  MiniAppBaseErrorPayload<SendHapticFeedbackErrorCodes>;

export type MiniAppSendHapticFeedbackPayload =
  | MiniAppSendHapticFeedbackSuccessPayload
  | MiniAppSendHapticFeedbackErrorPayload;

export type SendHapticFeedbackOptions = SendHapticFeedbackParams &
  FallbackConfig<MiniAppSendHapticFeedbackSuccessPayload>;

export class SendHapticFeedbackError extends Error {
  constructor(public readonly error_code: SendHapticFeedbackErrorCodes) {
    super(`Send haptic feedback failed: ${error_code}`);
    this.name = 'SendHapticFeedbackError';
  }
}
