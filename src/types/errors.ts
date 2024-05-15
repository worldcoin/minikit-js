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
}

export enum PaymentErrorMessage {
  MalformedRequest = "There was a problem with this request. Please try again or contact the app owner.",
  PaymentRejected = "You’ve cancelled the payment in World App.",
  InvalidReceiver = "The receiver address is invalid. Please contact the app owner.",
  InsufficientBalance = "You do not have enough balance to complete this transaction.",
  TransactionFailed = "The transaction failed. Please try again.",
  InvalidTokenAddress = "The token address is invalid. Please contact the app owner.",
  InvalidAppId = "The app ID is invalid. Please contact the app owner.",
  GenericError = "Something unexpected went wrong. Please try again.",
  DuplicateReference = "This reference ID already exists please generate a new one and try again.",
}

export enum WalletAuthErrorCodes {
  InvalidAddress = "invalid_address",
  MalformedRequest = "malformed_request",
  UserRejected = "user_rejected",
}

export const WalletAuthErrorMessage = {
  [WalletAuthErrorCodes.InvalidAddress]:
    "The specified address is not valid for the connected wallet.",
  [WalletAuthErrorCodes.MalformedRequest]:
    "Provided parameters in the request are invalid.",
  [WalletAuthErrorCodes.UserRejected]: "User rejected the request.",
};
