// ============================================================================
// Payment Primitives (moved from types/payment.ts)
// ============================================================================
export var Tokens;
(function (Tokens) {
  Tokens['USDC'] = 'USDCE';
  Tokens['WLD'] = 'WLD';
})(Tokens || (Tokens = {}));
export const TokenDecimals = {
  [Tokens.USDC]: 6,
  [Tokens.WLD]: 18,
};
export var Network;
(function (Network) {
  Network['Optimism'] = 'optimism';
  Network['WorldChain'] = 'worldchain';
})(Network || (Network = {}));
export var PaymentErrorCodes;
(function (PaymentErrorCodes) {
  PaymentErrorCodes['InputError'] = 'input_error';
  PaymentErrorCodes['UserRejected'] = 'user_rejected';
  PaymentErrorCodes['PaymentRejected'] = 'payment_rejected';
  PaymentErrorCodes['InvalidReceiver'] = 'invalid_receiver';
  PaymentErrorCodes['InsufficientBalance'] = 'insufficient_balance';
  PaymentErrorCodes['TransactionFailed'] = 'transaction_failed';
  PaymentErrorCodes['GenericError'] = 'generic_error';
  PaymentErrorCodes['UserBlocked'] = 'user_blocked';
})(PaymentErrorCodes || (PaymentErrorCodes = {}));
export const PaymentErrorMessage = {
  [PaymentErrorCodes.InputError]:
    'There was a problem with this request. Please try again or contact the app owner.',
  [PaymentErrorCodes.UserRejected]:
    'You have cancelled the payment in World App.',
  [PaymentErrorCodes.PaymentRejected]:
    "You've cancelled the payment in World App.",
  [PaymentErrorCodes.InvalidReceiver]:
    'The receiver address is invalid. Please contact the app owner.',
  [PaymentErrorCodes.InsufficientBalance]:
    'You do not have enough balance to complete this transaction.',
  [PaymentErrorCodes.TransactionFailed]:
    'The transaction failed. Please try again.',
  [PaymentErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
  [PaymentErrorCodes.UserBlocked]:
    "User's region is blocked from making payments.",
};
export class PayError extends Error {
  constructor(code) {
    super(`Payment failed: ${code}`);
    this.name = 'PayError';
    this.code = code;
  }
}
