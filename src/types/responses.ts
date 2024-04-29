import { Network } from "./payment";
import { PaymentErrorCodes, VerificationErrorCodes } from "./errors";
import { VerificationLevel } from "@worldcoin/idkit-core";

export enum ResponseEvent {
  MiniAppVerifyAction = "miniapp-verify-action",
  MiniAppPayment = "miniapp-payment",
}

export type MiniAppVerifyActionSuccessPayload = {
  status: "success";
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel;
};

export type MiniAppVerifyActionErrorPayload = {
  status: "error";
  error_code: VerificationErrorCodes;
};

export type MiniAppVerifyActionPayload =
  | MiniAppVerifyActionSuccessPayload
  | MiniAppVerifyActionErrorPayload;

export type MiniAppPaymentSuccessEventPayload = {
  status: "success";
  transaction_status: "submitted";
  reference: string;
  from: string;
  chain: Network;
  timestamp: string;
};

export type MiniAppPaymentErrorPayload = {
  status: "error";
  error_code: PaymentErrorCodes;
};

export type MiniAppPaymentPayload =
  | MiniAppPaymentSuccessEventPayload
  | MiniAppPaymentErrorPayload;

export type EventPayload<T extends ResponseEvent = ResponseEvent> =
  T extends ResponseEvent.MiniAppVerifyAction
    ? MiniAppVerifyActionPayload
    : MiniAppPaymentPayload;

export type EventHandler<E extends ResponseEvent = ResponseEvent> = <
  T extends EventPayload<E>,
>(
  data: T
) => void;
