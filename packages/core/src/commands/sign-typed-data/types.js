export var SignTypedDataErrorCodes;
(function (SignTypedDataErrorCodes) {
  SignTypedDataErrorCodes['InvalidOperation'] = 'invalid_operation';
  SignTypedDataErrorCodes['UserRejected'] = 'user_rejected';
  SignTypedDataErrorCodes['InputError'] = 'input_error';
  SignTypedDataErrorCodes['SimulationFailed'] = 'simulation_failed';
  SignTypedDataErrorCodes['GenericError'] = 'generic_error';
  SignTypedDataErrorCodes['DisallowedOperation'] = 'disallowed_operation';
  SignTypedDataErrorCodes['InvalidContract'] = 'invalid_contract';
  SignTypedDataErrorCodes['MaliciousOperation'] = 'malicious_operation';
})(SignTypedDataErrorCodes || (SignTypedDataErrorCodes = {}));
export class SignTypedDataError extends Error {
  constructor(error_code) {
    super(`Sign typed data failed: ${error_code}`);
    this.error_code = error_code;
    this.name = 'SignTypedDataError';
  }
}
