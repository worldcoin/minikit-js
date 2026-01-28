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

export { tokenToDecimals } from 'helpers/payment/client';

export { VerificationLevel, type ISuccessResult } from '@worldcoin/idkit-core';
export {
  verifyCloudProof,
  type IVerifyResponse,
} from '@worldcoin/idkit-core/backend';

export { parseSiweMessage, verifySiweMessage } from 'helpers/siwe/siwe';

export { getIsUserVerified } from 'helpers/address-book';
