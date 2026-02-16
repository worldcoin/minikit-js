export var SignMessageErrorCodes;
(function (SignMessageErrorCodes) {
  SignMessageErrorCodes['InvalidMessage'] = 'invalid_message';
  SignMessageErrorCodes['UserRejected'] = 'user_rejected';
  SignMessageErrorCodes['GenericError'] = 'generic_error';
})(SignMessageErrorCodes || (SignMessageErrorCodes = {}));
export class SignMessageError extends Error {
  constructor(error_code) {
    super(`Sign message failed: ${error_code}`);
    this.error_code = error_code;
    this.name = 'SignMessageError';
  }
}
