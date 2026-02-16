export var RequestPermissionErrorCodes;
(function (RequestPermissionErrorCodes) {
  RequestPermissionErrorCodes['UserRejected'] = 'user_rejected';
  RequestPermissionErrorCodes['GenericError'] = 'generic_error';
  RequestPermissionErrorCodes['AlreadyRequested'] = 'already_requested';
  RequestPermissionErrorCodes['PermissionDisabled'] = 'permission_disabled';
  RequestPermissionErrorCodes['AlreadyGranted'] = 'already_granted';
  RequestPermissionErrorCodes['UnsupportedPermission'] =
    'unsupported_permission';
})(RequestPermissionErrorCodes || (RequestPermissionErrorCodes = {}));
export class RequestPermissionError extends Error {
  constructor(error_code) {
    super(`Request permission failed: ${error_code}`);
    this.error_code = error_code;
    this.name = 'RequestPermissionError';
  }
}
