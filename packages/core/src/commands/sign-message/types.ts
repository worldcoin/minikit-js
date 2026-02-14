import type {
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

export type SignMessageInput = {
  message: string;
};

export enum SignMessageErrorCodes {
  InvalidMessage = 'invalid_message',
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export type MiniAppSignMessageSuccessPayload = MiniAppBaseSuccessPayload & {
  signature: string;
  address: string;
};

export type MiniAppSignMessageErrorPayload =
  MiniAppBaseErrorPayload<SignMessageErrorCodes> & {
    details?: Record<string, any>;
  };

export type MiniAppSignMessagePayload =
  | MiniAppSignMessageSuccessPayload
  | MiniAppSignMessageErrorPayload;

export class SignMessageError extends Error {
  constructor(public readonly error_code: SignMessageErrorCodes) {
    super(`Sign message failed: ${error_code}`);
    this.name = 'SignMessageError';
  }
}
