export { MiniKit } from './minikit';

// Export all command types from the new location
export * from './commands';

// Export shared types that didn't move
// Note: Error codes are now co-located with commands, only MiniKitInstallErrorCodes is needed here
export {
  MiniKitInstallErrorCodes,
  MiniKitInstallErrorMessage,
} from './types/errors';
export * from './types/init';
export * from './types/payment';
export * from './types/transactions';

// Re-export wallet-auth types that are used by helpers
export * from './types/wallet-auth';

export { tokenToDecimals } from 'helpers/payment';

// Backward compatibility — VerificationLevel and legacy types
export {
  VerificationErrorCodes,
  VerificationLevel,
  type VerifyResult,
} from './types/verification';

// IDKit verification — re-export everything developers need
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

// isInWorldApp — re-export from IDKit (canonical implementation)
export { isInWorldApp } from '@worldcoin/idkit-core';

export { parseSiweMessage, verifySiweMessage } from 'helpers/siwe';

export { getIsUserVerified } from 'helpers/address-book';
