import type {
  FallbackConfig,
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

type AttestationParams = {
  /**
   * Hex-encoded hash of the request body to attest.
   */
  requestHash: string;
};

/** @deprecated Use {@link MiniKitAttestationOptions} instead */
export type AttestationInput = AttestationParams;

export interface MiniKitAttestationOptions<
  TCustomFallback = MiniAppAttestationSuccessPayload,
> extends AttestationParams,
    FallbackConfig<TCustomFallback> {}

export enum AttestationErrorCodes {
  Unauthorized = 'unauthorized',
  AttestationFailed = 'attestation_failed',
  IntegrityFailed = 'integrity_failed',
  InvalidInput = 'invalid_input',
  UnsupportedVersion = 'unsupported_version',
}

export type MiniAppAttestationSuccessPayload = MiniAppBaseSuccessPayload & {
  token: string;
};

export type MiniAppAttestationErrorPayload =
  MiniAppBaseErrorPayload<AttestationErrorCodes> & {
    description: string;
  };

export type MiniAppAttestationPayload =
  | MiniAppAttestationSuccessPayload
  | MiniAppAttestationErrorPayload;

export class AttestationError extends Error {
  constructor(public readonly error_code: AttestationErrorCodes) {
    super(`Attestation failed: ${error_code}`);
    this.name = 'AttestationError';
  }
}
