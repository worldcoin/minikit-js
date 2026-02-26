import type {
  FallbackConfig,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

type ShareParams = {
  files?: File[];
  title?: string;
  text?: string;
  url?: string;
};

/** @deprecated Use {@link MiniKitShareOptions} instead */
export type ShareInput = ShareParams;

export interface MiniKitShareOptions<
  TCustomFallback = MiniAppSharePayload,
> extends ShareParams,
    FallbackConfig<TCustomFallback> {}

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
