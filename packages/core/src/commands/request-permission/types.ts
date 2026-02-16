import type { Permission } from '../get-permissions';
import type {
  FallbackConfig,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

type RequestPermissionParams = {
  permission: Permission;
};

/** @deprecated Use {@link MiniKitRequestPermissionOptions} instead */
export type RequestPermissionInput = RequestPermissionParams;

export enum RequestPermissionErrorCodes {
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
  AlreadyRequested = 'already_requested',
  PermissionDisabled = 'permission_disabled',
  AlreadyGranted = 'already_granted',
  UnsupportedPermission = 'unsupported_permission',
}

export type MiniAppRequestPermissionSuccessPayload =
  MiniAppBaseSuccessPayload & {
    permission: Permission;
    timestamp: string;
  };

export type MiniAppRequestPermissionErrorPayload =
  MiniAppBaseErrorPayload<RequestPermissionErrorCodes> & {
    description: string;
  };

export type MiniAppRequestPermissionPayload =
  | MiniAppRequestPermissionSuccessPayload
  | MiniAppRequestPermissionErrorPayload;

export interface MiniKitRequestPermissionOptions<
  TCustomFallback = MiniAppRequestPermissionPayload,
> extends RequestPermissionParams,
    FallbackConfig<TCustomFallback> {}

export class RequestPermissionError extends Error {
  constructor(public readonly error_code: RequestPermissionErrorCodes) {
    super(`Request permission failed: ${error_code}`);
    this.name = 'RequestPermissionError';
  }
}
