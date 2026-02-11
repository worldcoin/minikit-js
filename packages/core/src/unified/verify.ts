/**
 * Unified verify command — delegates to IDKit
 *
 * IDKit owns verification. MiniKit re-exports its API directly.
 * Transport detection (native postMessage vs bridge/QR) happens
 * inside IDKit's builder at .preset() / .constraints() time.
 *
 * Note: `isInWorldApp` comes from MiniKit's local fallback module
 * (same implementation). `IDKit.verify` is aliased to `IDKit.request`
 * for forward compatibility with IDKit releases that add the alias.
 */

// Re-export IDKit verification API — same language, same types
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

// Keep VerificationLevel for backward compatibility with existing MiniKit consumers
export { VerificationLevel } from '../../types/verification';
