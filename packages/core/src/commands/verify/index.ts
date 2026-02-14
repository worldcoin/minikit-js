export * from './types';

// ============================================================================
// IDKit re-exports (unified verify delegates to IDKit)
// ============================================================================

export {
  CredentialRequest,
  IDKit,
  IDKitErrorCodes,
  all,
  any,
  documentLegacy,
  hashSignal,
  orbLegacy,
  secureDocumentLegacy,
  signRequest,
} from '@worldcoin/idkit-core';

export type {
  AbiEncodedValue,
  ConstraintNode,
  CredentialRequestType,
  CredentialType,
  DocumentLegacyPreset,
  IDKitCompletionResult,
  IDKitErrorCode,
  IDKitRequest,
  IDKitRequestConfig,
  IDKitResult,
  IDKitResultSession,
  IDKitSessionConfig,
  OrbLegacyPreset,
  Preset,
  ResponseItemSession,
  ResponseItemV3,
  ResponseItemV4,
  RpContext,
  RpSignature,
  SecureDocumentLegacyPreset,
  Status,
  WaitOptions,
} from '@worldcoin/idkit-core';
