import type {
  FallbackConfig,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

export enum GetPermissionsErrorCodes {
  GenericError = 'generic_error',
}

export enum Permission {
  Notifications = 'notifications',
  Contacts = 'contacts',
  Microphone = 'microphone',
}

export type PermissionSettings = {
  [K in Permission]?: any;
};

export type MiniAppGetPermissionsSuccessPayload = MiniAppBaseSuccessPayload & {
  permissions: PermissionSettings;
  timestamp: string;
};

export type MiniAppGetPermissionsErrorPayload =
  MiniAppBaseErrorPayload<GetPermissionsErrorCodes> & {
    details: string;
  };

export type MiniAppGetPermissionsPayload =
  | MiniAppGetPermissionsSuccessPayload
  | MiniAppGetPermissionsErrorPayload;

export interface MiniKitGetPermissionsOptions<
  TCustomFallback = MiniAppGetPermissionsPayload,
> extends FallbackConfig<TCustomFallback> {}

export class GetPermissionsError extends Error {
  constructor(public readonly error_code: GetPermissionsErrorCodes) {
    super(`Get permissions failed: ${error_code}`);
    this.name = 'GetPermissionsError';
  }
}
