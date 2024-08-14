import { Network } from "./payment";
import {
  PaymentErrorCodes,
  VerificationErrorCodes,
  WalletAuthErrorCodes,
  WalletAuthErrorMessage,
} from "./errors";
import { VerificationLevel } from "@worldcoin/idkit-core";

export enum ResponseEvent {
  MiniAppVerifyAction = "miniapp-verify-action",
  MiniAppPayment = "miniapp-payment",
  MiniAppWalletAuth = "miniapp-wallet-auth",
}

export type MiniAppVerifyActionSuccessPayload = {
  status: "success";
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
  version: number;
};

export type MiniAppVerifyActionErrorPayload = {
  status: "error";
  error_code: VerificationErrorCodes;
  version: number;
};

export type MiniAppVerifyActionPayload =
  | MiniAppVerifyActionSuccessPayload
  | MiniAppVerifyActionErrorPayload;

export type MiniAppPaymentSuccessPayload = {
  status: "success";
  transaction_status: "submitted";
  transaction_id: string;
  reference: string;
  from: string;
  chain: Network;
  timestamp: string;
  version: number;
};

export type MiniAppPaymentErrorPayload = {
  status: "error";
  error_code: PaymentErrorCodes;
  version: number;
};

export type MiniAppPaymentPayload =
  | MiniAppPaymentSuccessPayload
  | MiniAppPaymentErrorPayload;

export type MiniAppWalletAuthSuccessPayload = {
  status: "success";
  message: string;
  signature: string;
  address: string;
  version: number;
};

export type MiniAppWalletAuthErrorPayload = {
  status: "error";
  error_code: WalletAuthErrorCodes;
  details: (typeof WalletAuthErrorMessage)[WalletAuthErrorCodes];
  version: number;
};

export type MiniAppWalletAuthPayload =
  | MiniAppWalletAuthSuccessPayload
  | MiniAppWalletAuthErrorPayload;

type EventPayloadMap = {
  [ResponseEvent.MiniAppVerifyAction]: MiniAppVerifyActionPayload;
  [ResponseEvent.MiniAppPayment]: MiniAppPaymentPayload;
  [ResponseEvent.MiniAppWalletAuth]: MiniAppWalletAuthPayload;
};

export type EventPayload<T extends ResponseEvent = ResponseEvent> =
  T extends keyof EventPayloadMap ? EventPayloadMap[T] : never;

export type EventHandler<E extends ResponseEvent = ResponseEvent> = <
  T extends EventPayload<E>,
>(
  data: T
) => void;
