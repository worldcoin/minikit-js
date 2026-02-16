export var ShareContactsErrorCodes;
(function (ShareContactsErrorCodes) {
  ShareContactsErrorCodes['UserRejected'] = 'user_rejected';
  ShareContactsErrorCodes['GenericError'] = 'generic_error';
})(ShareContactsErrorCodes || (ShareContactsErrorCodes = {}));
export const ShareContactsErrorMessage = {
  [ShareContactsErrorCodes.UserRejected]: 'User rejected the request.',
  [ShareContactsErrorCodes.GenericError]: 'Something unexpected went wrong.',
};
export class ShareContactsError extends Error {
  constructor(code) {
    super(`Share contacts failed: ${code}`);
    this.name = 'ShareContactsError';
    this.code = code;
  }
}
