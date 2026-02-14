import type {
  MiniAppBaseErrorPayload,
  MiniAppBaseSuccessPayload,
} from '../types';

// ============================================================================
// Verification Primitives (moved from types/verification.ts)
// ============================================================================

export enum VerificationLevel {
  Orb = 'orb',
  Device = 'device',
}

export enum VerificationErrorCodes {
  VerificationRejected = 'verification_rejected',
  MaxVerificationsReached = 'max_verifications_reached',
  CredentialUnavailable = 'credential_unavailable',
  MalformedRequest = 'malformed_request',
  InvalidNetwork = 'invalid_network',
  InclusionProofFailed = 'inclusion_proof_failed',
  InclusionProofPending = 'inclusion_proof_pending',
  UnexpectedResponse = 'unexpected_response',
  FailedByHostApp = 'failed_by_host_app',
  GenericError = 'generic_error',
  ConnectionFailed = 'connection_failed',
}

export interface VerifyConfig {
  action: string;
  signal?: string;
  verification_level?: VerificationLevel | VerificationLevel[];
}

export interface VerifyResult {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
}

// ============================================================================
// Verify Command Types
// ============================================================================

export type VerifyCommandInput = {
  action: VerifyConfig['action'];
  signal?: VerifyConfig['signal'];
  verification_level?:
    | VerificationLevel
    | [VerificationLevel, ...VerificationLevel[]];
};

export type VerifyCommandPayload = VerifyCommandInput & {
  timestamp: string;
};

export type MiniAppVerifyActionSuccessPayload = MiniAppBaseSuccessPayload & {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
};

// Individual verification result (without status/version per entry)
export type VerificationResult = Omit<
  MiniAppVerifyActionSuccessPayload,
  'status' | 'version'
>;

export type MiniAppVerifyActionMultiSuccessPayload =
  MiniAppBaseSuccessPayload & {
    verifications: VerificationResult[];
  };

export type MiniAppVerifyActionErrorPayload = MiniAppBaseErrorPayload<string>;

export type MiniAppVerifyActionPayload =
  | MiniAppVerifyActionSuccessPayload
  | MiniAppVerifyActionMultiSuccessPayload
  | MiniAppVerifyActionErrorPayload;
