import { AppErrorCodes } from '@worldcoin/idkit-core';

export { AppErrorCodes as VerificationErrorCodes } from '@worldcoin/idkit-core';

export const VerificationErrorMessage: Record<AppErrorCodes, string> = {
  [AppErrorCodes.VerificationRejected]:
    "You've cancelled the request in World App.",
  [AppErrorCodes.MaxVerificationsReached]:
    'You have already verified the maximum number of times for this action.',
  [AppErrorCodes.CredentialUnavailable]:
    'It seems you do not have the verification level required by this app.',
  [AppErrorCodes.MalformedRequest]:
    'There was a problem with this request. Please try again or contact the app owner.',
  [AppErrorCodes.InvalidNetwork]:
    'Invalid network. If you are the app owner, visit docs.worldcoin.org/test for details.',
  [AppErrorCodes.InclusionProofFailed]:
    'There was an issue fetching your credential. Please try again.',
  [AppErrorCodes.InclusionProofPending]:
    'Your identity is still being registered. Please wait a few minutes and try again.',
  [AppErrorCodes.UnexpectedResponse]:
    'Unexpected response from your wallet. Please try again.',
  [AppErrorCodes.FailedByHostApp]:
    'Verification failed by the app. Please contact the app owner for details.',
  [AppErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
  [AppErrorCodes.ConnectionFailed]:
    'Connection to your wallet failed. Please try again.',
};

export enum PaymentErrorCodes {
  InputError = 'input_error',
  UserRejected = 'user_rejected',
  PaymentRejected = 'payment_rejected',
  InvalidReceiver = 'invalid_receiver',
  InsufficientBalance = 'insufficient_balance',
  TransactionFailed = 'transaction_failed',
  GenericError = 'generic_error',
  UserBlocked = 'user_blocked',
}

export const PaymentErrorMessage: Record<PaymentErrorCodes, string> = {
  [PaymentErrorCodes.InputError]:
    'There was a problem with this request. Please try again or contact the app owner.',
  [PaymentErrorCodes.UserRejected]:
    'You have cancelled the payment in World App.',
  [PaymentErrorCodes.PaymentRejected]:
    "You've cancelled the payment in World App.",
  [PaymentErrorCodes.InvalidReceiver]:
    'The receiver address is invalid. Please contact the app owner.',
  [PaymentErrorCodes.InsufficientBalance]:
    'You do not have enough balance to complete this transaction.',
  [PaymentErrorCodes.TransactionFailed]:
    'The transaction failed. Please try again.',
  [PaymentErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
  [PaymentErrorCodes.UserBlocked]:
    "User's region is blocked from making payments.",
};

export enum PaymentValidationErrors {
  MalformedRequest = 'There was a problem with this request. Please try again or contact the app owner.',
  InvalidTokenAddress = 'The token address is invalid. Please contact the app owner.',
  InvalidAppId = 'The app ID is invalid. Please contact the app owner.',
  DuplicateReference = 'This reference ID already exists please generate a new one and try again.',
}

export enum WalletAuthErrorCodes {
  MalformedRequest = 'malformed_request',
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export const WalletAuthErrorMessage = {
  [WalletAuthErrorCodes.MalformedRequest]:
    'Provided parameters in the request are invalid.',
  [WalletAuthErrorCodes.UserRejected]: 'User rejected the request.',
  [WalletAuthErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export enum SendTransactionErrorCodes {
  InvalidOperation = 'invalid_operation',
  UserRejected = 'user_rejected',
  InputError = 'input_error',
  SimulationFailed = 'simulation_failed',
  TransactionFailed = 'transaction_failed',
  GenericError = 'generic_error',
  DisallowedOperation = 'disallowed_operation',
  ValidationError = 'validation_error',
  InvalidContract = 'invalid_contract',
  MaliciousOperation = 'malicious_operation',
  DailyTxLimitReached = 'daily_tx_limit_reached',
  PermittedAmountExceedsSlippage = 'permitted_amount_exceeds_slippage',
  PermittedAmountNotFound = 'permitted_amount_not_found',
}

export const SendTransactionErrorMessage: Record<
  SendTransactionErrorCodes,
  string
> = {
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

export enum SignMessageErrorCodes {
  InvalidMessage = 'invalid_message',
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export const SignMessageErrorMessage = {
  [SignMessageErrorCodes.InvalidMessage]: 'Invalid message requested',
  [SignMessageErrorCodes.UserRejected]: 'User rejected the request.',
  [SignMessageErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export enum SignTypedDataErrorCodes {
  InvalidOperation = 'invalid_operation',
  UserRejected = 'user_rejected',
  InputError = 'input_error',
  SimulationFailed = 'simulation_failed',
  GenericError = 'generic_error',
  DisallowedOperation = 'disallowed_operation',
  InvalidContract = 'invalid_contract',
  MaliciousOperation = 'malicious_operation',
}

export const SignTypedDataErrorMessage = {
  [SignTypedDataErrorCodes.InvalidOperation]:
    'Transaction included an operation that was invalid',
  [SignTypedDataErrorCodes.UserRejected]: 'User rejected the request.',
  [SignTypedDataErrorCodes.InputError]: 'Invalid payload.',
  [SignTypedDataErrorCodes.SimulationFailed]:
    'The transaction simulation failed.',
  [SignTypedDataErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
  [SignTypedDataErrorCodes.DisallowedOperation]:
    'The operation requested is not allowed. Please refer to the docs.',
  [SignTypedDataErrorCodes.InvalidContract]:
    'The contract address is not allowed for your application. Please check your developer portal configurations',
  [SignTypedDataErrorCodes.MaliciousOperation]:
    'The operation requested is considered malicious.',
};

export enum MiniKitInstallErrorCodes {
  Unknown = 'unknown',
  AlreadyInstalled = 'already_installed',
  OutsideOfWorldApp = 'outside_of_worldapp',
  NotOnClient = 'not_on_client',
  AppOutOfDate = 'app_out_of_date',
}

export const MiniKitInstallErrorMessage = {
  [MiniKitInstallErrorCodes.Unknown]: 'Failed to install MiniKit.',
  [MiniKitInstallErrorCodes.AlreadyInstalled]: 'MiniKit is already installed.',
  [MiniKitInstallErrorCodes.OutsideOfWorldApp]:
    'MiniApp launched outside of WorldApp.',
  [MiniKitInstallErrorCodes.NotOnClient]: 'Window object is not available.',
  [MiniKitInstallErrorCodes.AppOutOfDate]:
    'WorldApp is out of date. Please update the app.',
};

export enum ShareContactsErrorCodes {
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
}

export const ShareContactsErrorMessage = {
  [ShareContactsErrorCodes.UserRejected]: 'User rejected the request.',
  [ShareContactsErrorCodes.GenericError]: 'Something unexpected went wrong.',
};

export enum RequestPermissionErrorCodes {
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
  AlreadyRequested = 'already_requested',
  PermissionDisabled = 'permission_disabled',
  AlreadyGranted = 'already_granted',
  UnsupportedPermission = 'unsupported_permission',
}

export const RequestPermissionErrorMessage = {
  [RequestPermissionErrorCodes.UserRejected]: 'User declined sharing contacts',
  [RequestPermissionErrorCodes.GenericError]:
    'Request failed for unknown reason.',
  [RequestPermissionErrorCodes.AlreadyRequested]:
    'User has already declined turning on notifications once',
  [RequestPermissionErrorCodes.PermissionDisabled]:
    'User does not have this permission enabled in World App',
  [RequestPermissionErrorCodes.AlreadyGranted]:
    'If the user has already granted this mini app permission',
  [RequestPermissionErrorCodes.UnsupportedPermission]:
    'The permission requested is not supported by this mini app',
};

export enum GetPermissionsErrorCodes {
  GenericError = 'generic_error',
}

export const GetPermissionsErrorMessage = {
  [GetPermissionsErrorCodes.GenericError]:
    'Something unexpected went wrong. Please try again.',
};

export enum SendHapticFeedbackErrorCodes {
  GenericError = 'generic_error',
  UserRejected = 'user_rejected',
}

export const SendHapticFeedbackErrorMessage = {
  [SendHapticFeedbackErrorCodes.GenericError]:
    'Something unexpected went wrong.',
  [SendHapticFeedbackErrorCodes.UserRejected]: 'User rejected the request.',
};

export enum ShareFilesErrorCodes {
  UserRejected = 'user_rejected',
  GenericError = 'generic_error',
  InvalidFileName = 'invalid_file_name',
}

export const ShareFilesErrorMessage = {
  [ShareFilesErrorCodes.UserRejected]: 'User rejected the request.',
  [ShareFilesErrorCodes.GenericError]: 'Something unexpected went wrong.',
  [ShareFilesErrorCodes.InvalidFileName]:
    'Invalid file name. Make sure you include the extension',
};

export enum MicrophoneErrorCodes {
  MiniAppPermissionNotEnabled = 'mini_app_permission_not_enabled',
  WorldAppPermissionNotEnabled = 'world_app_permission_not_enabled',
}

export const MicrophoneErrorMessage = {
  [MicrophoneErrorCodes.MiniAppPermissionNotEnabled]:
    'Microphone permission not enabled for your Mini App',
  [MicrophoneErrorCodes.WorldAppPermissionNotEnabled]:
    'Microphone permission not enabled in World App',
};
