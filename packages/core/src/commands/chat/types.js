export var ChatErrorCodes;
(function (ChatErrorCodes) {
  ChatErrorCodes['UserRejected'] = 'user_rejected';
  ChatErrorCodes['SendFailed'] = 'send_failed';
  ChatErrorCodes['GenericError'] = 'generic_error';
})(ChatErrorCodes || (ChatErrorCodes = {}));
export class ChatError extends Error {
  constructor(error_code) {
    super(`Chat failed: ${error_code}`);
    this.error_code = error_code;
    this.name = 'ChatError';
  }
}
