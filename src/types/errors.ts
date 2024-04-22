import { AppErrorCodes } from "@worldcoin/idkit-core";

export enum VerificationErrorCodes {
  VerificationRejected = AppErrorCodes.VerificationRejected,
  MaxVerificationsReached = AppErrorCodes.MaxVerificationsReached,
  CredentialUnavailable = AppErrorCodes.CredentialUnavailable,
  MalformedRequest = AppErrorCodes.MalformedRequest,
  InvalidNetwork = AppErrorCodes.InvalidNetwork,
  InclusionProofFailed = AppErrorCodes.InclusionProofFailed,
  InclusionProofPending = AppErrorCodes.InclusionProofPending,
  UnexpectedResponse = AppErrorCodes.UnexpectedResponse,
  FailedByHostApp = AppErrorCodes.FailedByHostApp,
  GenericError = AppErrorCodes.GenericError,
}

export enum VerificationErrorMessage {
  VerificationRejected = "You’ve cancelled the request in World App.",
  MaxVerificationsReached = "You have already verified the maximum number of times for this action.",
  CredentialUnavailable = "It seems you do not have the verification level required by this app.",
  MalformedRequest = "There was a problem with this request. Please try again or contact the app owner.",
  InvalidNetwork = "Invalid network. If you are the app owner, visit docs.worldcoin.org/test for details.",
  InclusionProofFailed = "There was an issue fetching your credential. Please try again.",
  InclusionProofPending = "Your identity is still being registered. Please wait a few minutes and try again.",
  UnexpectedResponse = "Unexpected response from your wallet. Please try again.",
  FailedByHostApp = "Verification failed by the app. Please contact the app owner for details.",
  GenericError = "Something unexpected went wrong. Please try again.",
}

export enum PaymentErrorCodes {
  MalformedRequest = "malformed_request",
  PaymentRejected = "payment_rejected",
  InvalidReceiver = "invalid_receiver",
  InsufficientBalance = "insufficient_balance",
  TransactionFailed = "transaction_failed",
  InvalidTokenAddress = "invalid_token_address",
  InvalidAppId = "invalid_app_id",
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
}
