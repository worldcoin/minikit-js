import { AppErrorCodes } from "@worldcoin/idkit-core";

export { AppErrorCodes as VerificationErrorCodes } from "@worldcoin/idkit-core";

export const VerificationErrorMessage: Record<AppErrorCodes, string> = {
  [AppErrorCodes.VerificationRejected]:
    "You’ve cancelled the request in World App.",
  [AppErrorCodes.MaxVerificationsReached]:
    "You have already verified the maximum number of times for this action.",
  [AppErrorCodes.CredentialUnavailable]:
    "It seems you do not have the verification level required by this app.",
  [AppErrorCodes.MalformedRequest]:
    "There was a problem with this request. Please try again or contact the app owner.",
  [AppErrorCodes.InvalidNetwork]:
    "Invalid network. If you are the app owner, visit docs.worldcoin.org/test for details.",
  [AppErrorCodes.InclusionProofFailed]:
    "There was an issue fetching your credential. Please try again.",
  [AppErrorCodes.InclusionProofPending]:
    "Your identity is still being registered. Please wait a few minutes and try again.",
  [AppErrorCodes.UnexpectedResponse]:
    "Unexpected response from your wallet. Please try again.",
  [AppErrorCodes.FailedByHostApp]:
    "Verification failed by the app. Please contact the app owner for details.",
  [AppErrorCodes.GenericError]:
    "Something unexpected went wrong. Please try again.",
  [AppErrorCodes.ConnectionFailed]:
    "Connection to your wallet failed. Please try again.",
};

export enum PaymentErrorCodes {
  InputError = "input_error",
  PaymentRejected = "payment_rejected",
  InvalidReceiver = "invalid_receiver",
  InsufficientBalance = "insufficient_balance",
  TransactionFailed = "transaction_failed",
  GenericError = "generic_error",
  UserBlocked = "user_blocked",
}

export const PaymentErrorMessage: Record<PaymentErrorCodes, string> = {
  [PaymentErrorCodes.InputError]:
    "There was a problem with this request. Please try again or contact the app owner.",
  [PaymentErrorCodes.PaymentRejected]:
    "You’ve cancelled the payment in World App.",
  [PaymentErrorCodes.InvalidReceiver]:
    "The receiver address is invalid. Please contact the app owner.",
  [PaymentErrorCodes.InsufficientBalance]:
    "You do not have enough balance to complete this transaction.",
  [PaymentErrorCodes.TransactionFailed]:
    "The transaction failed. Please try again.",
  [PaymentErrorCodes.GenericError]:
    "Something unexpected went wrong. Please try again.",
  [PaymentErrorCodes.UserBlocked]:
    "User's region is blocked from making payments.",
};

export enum PaymentValidationErrors {
  MalformedRequest = "There was a problem with this request. Please try again or contact the app owner.",
  InvalidTokenAddress = "The token address is invalid. Please contact the app owner.",
  InvalidAppId = "The app ID is invalid. Please contact the app owner.",
  DuplicateReference = "This reference ID already exists please generate a new one and try again.",
}

export enum WalletAuthErrorCodes {
  MalformedRequest = "malformed_request",
  UserRejected = "user_rejected",
  GenericError = "generic_error",
}

export const WalletAuthErrorMessage = {
  [WalletAuthErrorCodes.MalformedRequest]:
    "Provided parameters in the request are invalid.",
  [WalletAuthErrorCodes.UserRejected]: "User rejected the request.",
  [WalletAuthErrorCodes.GenericError]: "Something unexpected went wrong.",
};

export enum SendTransactionErrorCodes {
  InvalidOperation = "invalid_operation",
  UserRejected = "user_rejected",
  InputError = "input_error",
  SimulationFailed = "simulation_failed",
  GenericError = "generic_error",
}

export const SendTransactionErrorMessage = {
  [SendTransactionErrorCodes.InvalidOperation]:
    "Transaction included an operation that was invalid",
  [SendTransactionErrorCodes.UserRejected]: "User rejected the request.",
  [SendTransactionErrorCodes.InputError]: "Invalid payload.",
  [SendTransactionErrorCodes.SimulationFailed]:
    "The transaction simulation failed.",
  [SendTransactionErrorCodes.GenericError]:
    "Something unexpected went wrong. Please try again.",
};

export enum SignMessageErrorCode {
  InvalidMessage = "invalid_message",
  UserRejected = "user_rejected",
  GenericError = "generic_error",
}

export const SignMessageErrorMessage = {
  [SignMessageErrorCode.InvalidMessage]: "Invalid message requested",
  [SignMessageErrorCode.UserRejected]: "User rejected the request.",
  [SignMessageErrorCode.GenericError]: "Something unexpected went wrong.",
};

export type SignTypedDataErrorCode = SignMessageErrorCode;

export const SignTypedDataErrorMessage = SignMessageErrorMessage;

export enum MiniKitInstallErrorCode {
  Unknown = "unknown",
  AlreadyInstalled = "already_installed",
  OutsideOfWorldApp = "outside_of_worldapp",
  NotOnClient = "not_on_client",
  AppOutOfDate = "app_out_of_date",
}

export const MiniKitInstallErrorMessage = {
  [MiniKitInstallErrorCode.Unknown]: "Failed to install MiniKit.",
  [MiniKitInstallErrorCode.AlreadyInstalled]: "MiniKit is already installed.",
  [MiniKitInstallErrorCode.OutsideOfWorldApp]:
    "MiniApp launched outside of WorldApp.",
  [MiniKitInstallErrorCode.NotOnClient]: "Window object is not available.",
  [MiniKitInstallErrorCode.AppOutOfDate]:
    "WorldApp is out of date. Please update the app.",
};
