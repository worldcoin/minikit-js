import type {
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

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

export type MiniAppShareSuccessPayload = MiniAppBaseSuccessPayload & {
  shared_files_count: number;
  timestamp: string;
};

export type MiniAppShareErrorPayload =
  MiniAppBaseErrorPayload<ShareFilesErrorCodes>;

export type MiniAppSharePayload =
  | MiniAppShareSuccessPayload
  | MiniAppShareErrorPayload;

export class ShareError extends Error {
  constructor(public readonly error_code: ShareFilesErrorCodes) {
    super(`Share failed: ${error_code}`);
    this.name = 'ShareError';
  }
}
