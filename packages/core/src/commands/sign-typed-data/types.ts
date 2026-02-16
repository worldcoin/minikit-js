import type { TypedData, TypedDataDomain } from 'abitype';
import type {
  FallbackConfig,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

type SignTypedDataParams = {
  types: TypedData;
  primaryType: string;
  message: Record<string, unknown>;
  domain?: TypedDataDomain;
  chainId?: number;
};

/** @deprecated Use {@link MiniKitSignTypedDataOptions} instead */
export type SignTypedDataInput = SignTypedDataParams;

export interface MiniKitSignTypedDataOptions<
  TCustomFallback = MiniAppSignTypedDataSuccessPayload,
> extends SignTypedDataParams,
    FallbackConfig<TCustomFallback> {}

export enum SignTypedDataErrorCodes {
  InvalidOperation = 'invalid_operation',
  UserRejected = 'user_rejected',
  InputError = 'input_error',
  SimulationFailed = 'simulation_failed',
  GenericError = 'generic_error',
  DisallowedOperation = 'disallowed_operation',
  InvalidContract = 'invalid_contract',
  MaliciousOperation = 'malicious_operation',
}

export type MiniAppSignTypedDataSuccessPayload = MiniAppBaseSuccessPayload & {
  signature: string;
  address: string;
};

export type MiniAppSignTypedDataErrorPayload =
  MiniAppBaseErrorPayload<SignTypedDataErrorCodes> & {
    details?: Record<string, any>;
  };

export type MiniAppSignTypedDataPayload =
  | MiniAppSignTypedDataSuccessPayload
  | MiniAppSignTypedDataErrorPayload;

export class SignTypedDataError extends Error {
  constructor(public readonly error_code: SignTypedDataErrorCodes) {
    super(`Sign typed data failed: ${error_code}`);
    this.name = 'SignTypedDataError';
  }
}
