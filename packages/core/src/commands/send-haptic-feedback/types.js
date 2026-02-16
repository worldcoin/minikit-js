export var SendHapticFeedbackErrorCodes;
(function (SendHapticFeedbackErrorCodes) {
  SendHapticFeedbackErrorCodes['GenericError'] = 'generic_error';
  SendHapticFeedbackErrorCodes['UserRejected'] = 'user_rejected';
})(SendHapticFeedbackErrorCodes || (SendHapticFeedbackErrorCodes = {}));
export class SendHapticFeedbackError extends Error {
  constructor(error_code) {
    super(`Send haptic feedback failed: ${error_code}`);
    this.error_code = error_code;
    this.name = 'SendHapticFeedbackError';
  }
}
