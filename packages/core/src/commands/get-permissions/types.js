export var GetPermissionsErrorCodes;
(function (GetPermissionsErrorCodes) {
  GetPermissionsErrorCodes['GenericError'] = 'generic_error';
})(GetPermissionsErrorCodes || (GetPermissionsErrorCodes = {}));
export var Permission;
(function (Permission) {
  Permission['Notifications'] = 'notifications';
  Permission['Contacts'] = 'contacts';
  Permission['Microphone'] = 'microphone';
})(Permission || (Permission = {}));
export class GetPermissionsError extends Error {
  constructor(error_code) {
    super(`Get permissions failed: ${error_code}`);
    this.error_code = error_code;
    this.name = 'GetPermissionsError';
  }
}
