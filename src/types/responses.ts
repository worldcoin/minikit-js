import { VerificationLevel } from "@worldcoin/idkit-core";
import { Network } from "./payment";
import { PaymentErrorCodes, VerificationErrorCodes } from "./errors";

export enum ResponseEvent {
  MiniAppVerifyAction = "miniapp-verify-action",
  MiniAppPayment = "miniapp-payment",
}

export type MiniAppVerifyActionSuccessPayload = {
  command: ResponseEvent.MiniAppVerifyAction;
  payload: {
    status: "success";
    proof: string;
    merkle_root: string;
    nullifier_hash: string;
    verification_level: VerificationLevel;
  };
};

export type MiniAppVerifyActionErrorPayload = {
  command: ResponseEvent.MiniAppVerifyAction;
  payload: {
    status: "error";
    error_code: VerificationErrorCodes;
  };
};

export type MiniAppVerifyActionPayload =
  | MiniAppVerifyActionSuccessPayload
  | MiniAppVerifyActionErrorPayload;

export type MiniAppPaymentOkPayload = {
  event: ResponseEvent.MiniAppPayment;
  payload: {
    from: string;
    transaction_hash: string;
    status: "completed" | "initiated";
    chain: Network;
    timestamp: string;
    signature: string;
  };
};

export type MiniAppPaymentErrorPayload = {
  event: ResponseEvent.MiniAppPayment;
  payload: {
    status: "error";
    error_code: PaymentErrorCodes;
  };
};

export type MiniAppPaymentPayload =
  | MiniAppPaymentOkPayload
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
