/**
 * Unified MiniKit commands
 *
 * These commands auto-detect the environment and use the best available transport:
 * - World App → native postMessage
 * - Web + Wagmi → Wagmi wallet
 * - Web (no Wagmi) → custom fallback or error
 */

// IDKit verification (re-exported from @worldcoin/idkit-core)
export {
  CredentialRequest,
  IDKit,
  IDKitErrorCodes,
  VerificationLevel,
  all,
  any,
  documentLegacy,
  hashSignal,
  orbLegacy,
  secureDocumentLegacy,
  signRequest,
} from './verify';

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
} from './verify';

// Wallet auth
export {
  WalletAuthError,
  walletAuth,
  type UnifiedWalletAuthOptions,
  type WalletAuthResult,
} from './wallet-auth';

// Send transaction
export {
  SendTransactionError,
  WEB_FEATURES,
  WORLD_APP_FEATURES,
  sendTransaction,
  type FeatureSupport,
  type SendTransactionResult,
  type UnifiedSendTransactionOptions,
} from './send-transaction';

// Pay (native only)
export {
  Network,
  PayError,
  Tokens,
  pay,
  type PayResult,
  type TokensPayload,
  type UnifiedPayOptions,
} from './pay';

// Share contacts (native only)
export {
  ShareContactsError,
  getContacts,
  shareContacts,
  type Contact,
  type ShareContactsResult,
  type UnifiedShareContactsOptions,
} from './share-contacts';

// Fallback system
export {
  executeWithFallback,
  isInWorldApp,
  type ExecuteWithFallbackOptions,
} from '../fallback';

export {
  CommandUnavailableError,
  FallbackRequiredError,
  type CommandResult,
  type CommandVia,
  type FallbackConfig,
  type FallbackReason,
} from '../fallback/types';

export { hasWagmiConfig, setWagmiConfig } from '../fallback/wagmi';
