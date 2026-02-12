/**
 * MiniKit types for World ID verification
 */

/**
 * Verification level - the credential type required
 */
export enum VerificationLevel {
  Orb = 'orb',
  Device = 'device',
}

/**
 * Verification error codes returned by World App
 */
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

/**
 * Verification input configuration
 */
export interface VerifyConfig {
  action: string;
  signal?: string;
  verification_level?: VerificationLevel | VerificationLevel[];
}

/**
 * Successful verification result
 */
export interface VerifyResult {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
}
