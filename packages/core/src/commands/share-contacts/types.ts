import type {
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
  FallbackConfig,
} from '../types';

type ShareContactsParams = {
  isMultiSelectEnabled: boolean;
  inviteMessage?: string;
};

/** @deprecated Use {@link ShareContactsOptions} instead */
export type ShareContactsInput = ShareContactsParams;

/** @deprecated Use {@link ShareContactsOptions} instead */
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

export interface ShareContactsOptions
  extends FallbackConfig<ShareContactsResult> {
  /** Enable multi-select in the contact picker */
  isMultiSelectEnabled?: boolean;

  /** Custom invite message for sharing */
  inviteMessage?: string;
}

export interface ShareContactsResult {
  /** Selected contacts */
  contacts: Contact[];
  /** Timestamp */
  timestamp: string;
}

export class ShareContactsError extends Error {
  public readonly code: string;

  constructor(code: string) {
    super(`Share contacts failed: ${code}`);
    this.name = 'ShareContactsError';
    this.code = code;
  }
}
