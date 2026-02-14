import type { TypedData, TypedDataDomain } from 'abitype';
import type {
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

export type SignTypedDataInput = {
  types: TypedData;
  primaryType: string;
  message: Record<string, unknown>;
  domain?: TypedDataDomain;
  chainId?: number;
};

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
