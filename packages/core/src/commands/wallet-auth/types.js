export var WalletAuthErrorCodes;
(function (WalletAuthErrorCodes) {
  WalletAuthErrorCodes['MalformedRequest'] = 'malformed_request';
  WalletAuthErrorCodes['UserRejected'] = 'user_rejected';
  WalletAuthErrorCodes['GenericError'] = 'generic_error';
})(WalletAuthErrorCodes || (WalletAuthErrorCodes = {}));
export const WalletAuthErrorMessage = {
  [WalletAuthErrorCodes.MalformedRequest]:
    'Provided parameters in the request are invalid.',
  [WalletAuthErrorCodes.UserRejected]: 'User rejected the request.',
  [WalletAuthErrorCodes.GenericError]: 'Something unexpected went wrong.',
};
export class WalletAuthError extends Error {
  constructor(code, details) {
    super(details || `Wallet auth failed: ${code}`);
    this.name = 'WalletAuthError';
    this.code = code;
    this.details = details;
  }
}
