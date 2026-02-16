export var ShareFilesErrorCodes;
(function (ShareFilesErrorCodes) {
  ShareFilesErrorCodes['UserRejected'] = 'user_rejected';
  ShareFilesErrorCodes['GenericError'] = 'generic_error';
  ShareFilesErrorCodes['InvalidFileName'] = 'invalid_file_name';
})(ShareFilesErrorCodes || (ShareFilesErrorCodes = {}));
export class ShareError extends Error {
  constructor(error_code) {
    super(`Share failed: ${error_code}`);
    this.error_code = error_code;
    this.name = 'ShareError';
  }
}
