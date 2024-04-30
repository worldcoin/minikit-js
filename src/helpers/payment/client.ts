import { Tokens } from "types";
import { PaymentErrorMessage } from "types/errors";
import { TokenDecimals } from "types/payment";
import { MiniAppPaymentErrorPayload } from "types/responses";

export const getPaymentErrorMessage = (
  payload: MiniAppPaymentErrorPayload
): void => {
  return PaymentErrorMessage[payload.error_code];
};

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
