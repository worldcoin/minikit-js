import { WalletAuthInput } from 'types/commands';

type ValidationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      message: string;
    };

export const validateWalletAuthCommandInput = (
  params: WalletAuthInput,
): ValidationResult => {
  if (!params.nonce) {
    return { valid: false, message: "'nonce' is required" };
  }

  if (params.nonce.length < 8) {
    return { valid: false, message: "'nonce' must be at least 8 characters" };
  }

  if (params.statement && params.statement.includes('\n')) {
    return { valid: false, message: "'statement' must not contain newlines" };
  }

  if (params.expirationTime && new Date(params.expirationTime) < new Date()) {
    return { valid: false, message: "'expirationTime' must be in the future" };
  }

  if (
    params.expirationTime &&
    new Date(params.expirationTime) >
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ) {
    return { valid: false, message: "'expirationTime' must be within 7 days" };
  }

  if (
    params.notBefore &&
    new Date(params.notBefore) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ) {
    return { valid: false, message: "'notBefore' must be within 7 days" };
  }

  return { valid: true };
};
