export var SendTransactionErrorCodes;
(function (SendTransactionErrorCodes) {
  SendTransactionErrorCodes['InvalidOperation'] = 'invalid_operation';
  SendTransactionErrorCodes['UserRejected'] = 'user_rejected';
  SendTransactionErrorCodes['InputError'] = 'input_error';
  SendTransactionErrorCodes['SimulationFailed'] = 'simulation_failed';
  SendTransactionErrorCodes['TransactionFailed'] = 'transaction_failed';
  SendTransactionErrorCodes['GenericError'] = 'generic_error';
  SendTransactionErrorCodes['DisallowedOperation'] = 'disallowed_operation';
  SendTransactionErrorCodes['ValidationError'] = 'validation_error';
  SendTransactionErrorCodes['InvalidContract'] = 'invalid_contract';
  SendTransactionErrorCodes['MaliciousOperation'] = 'malicious_operation';
  SendTransactionErrorCodes['DailyTxLimitReached'] = 'daily_tx_limit_reached';
  SendTransactionErrorCodes['PermittedAmountExceedsSlippage'] =
    'permitted_amount_exceeds_slippage';
  SendTransactionErrorCodes['PermittedAmountNotFound'] =
    'permitted_amount_not_found';
})(SendTransactionErrorCodes || (SendTransactionErrorCodes = {}));
export const SendTransactionErrorMessage = {
  [SendTransactionErrorCodes.InvalidOperation]:
    'Transaction included an operation that was invalid',
  [SendTransactionErrorCodes.UserRejected]: 'User rejected the request.',
  [SendTransactionErrorCodes.InputError]: 'Invalid payload.',
  [SendTransactionErrorCodes.SimulationFailed]:
    'The transaction simulation failed.',
  [SendTransactionErrorCodes.ValidationError]:
    'The transaction validation failed. Please try again.',
  [SendTransactionErrorCodes.TransactionFailed]:
    'The transaction failed. Please try again later.',
  [SendTransactionErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
  [SendTransactionErrorCodes.DisallowedOperation]:
    'The operation requested is not allowed. Please refer to the docs.',
  [SendTransactionErrorCodes.InvalidContract]:
    'The contract address is not allowed for your application. Please check your developer portal configurations',
  [SendTransactionErrorCodes.MaliciousOperation]:
    'The operation requested is considered malicious.',
  [SendTransactionErrorCodes.DailyTxLimitReached]:
    'Daily transaction limit reached. Max 100 transactions per day. Wait until the next day.',
  [SendTransactionErrorCodes.PermittedAmountExceedsSlippage]:
    'Permitted amount exceeds slippage. You must spend at least 90% of the permitted amount.',
  [SendTransactionErrorCodes.PermittedAmountNotFound]:
    'Permitted amount not found in permit2 payload.',
};
export const WORLD_APP_FEATURES = {
  batch: true,
  permit2: true,
  gasSponsorship: true,
};
export const WEB_FEATURES = {
  batch: false,
  permit2: false,
  gasSponsorship: false,
};
export class SendTransactionError extends Error {
  constructor(code, details) {
    super(`Transaction failed: ${code}`);
    this.name = 'SendTransactionError';
    this.code = code;
    this.details = details;
  }
}
