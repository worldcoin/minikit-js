import { PayCommandInput } from 'types/commands';
import { TokenDecimals, Tokens } from 'types/payment';

// This is a helper function to convert token amount to decimals for payment
// Amount should be in expected amount ie $25.12 should be 25.12
export const tokenToDecimals = (amount: number, token: Tokens): number => {
  const decimals = TokenDecimals[token];
  if (decimals === undefined) {
    throw new Error(`Invalid token: ${token}`);
  }
  const factor = 10 ** decimals;
  const result = amount * factor;
  if (!Number.isInteger(result)) {
    throw new Error(`The resulting amount is not a whole number: ${result}`);
  }
  return result;
};

export const validatePaymentPayload = (payload: PayCommandInput): boolean => {
  if (
    payload.tokens.some(
      (token) =>
        token.symbol == Tokens.USDC && parseFloat(token.token_amount) < 0.1,
    )
  ) {
    console.error('USDC amount should be greater than $0.1');
    return false; // reject
  }

  if (payload.reference.length > 36) {
    console.error('Reference must not exceed 36 characters');
    return false;
  }

  if (typeof payload.reference !== 'string') {
    throw new Error('Reference must be a string');
  }

  return true; // accept
};
