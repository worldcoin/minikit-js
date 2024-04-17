import { VerificationLevel } from "@worldcoin/idkit-core";

export enum ResponseEvent {
  MiniAppVerifyAction = "miniapp-verify-action",
  MiniAppPaymentInitiated = "miniapp-payment-initiated",
  MiniAppPaymentCompleted = "miniapp-payment-completed",
}

export type MiniAppVerifyActionPayload = {
  command: ResponseEvent.MiniAppVerifyAction;

  payload: {
    status: "success" | "error";
    error_code: string;
    error_message: string;
    proof: string;
    merkle_root: string;
    nullifier_hash: string;
    verification_level: VerificationLevel;
  };
};

export type MiniAppPaymentInitiatedPayload = {
  event: ResponseEvent.MiniAppPaymentInitiated;

  payload: {
    transaction_hash: string;
    status: "completed" | "error";
    chain: string;
    nonce?: string;
    timestamp: string;
    error_code?: string;
    error_message?: string;
  };
};

export type MiniAppPaymentCompletedPayload = {
  event: ResponseEvent.MiniAppPaymentCompleted;

  payload: {
    transaction_hash: string;
    "status:": "completed" | "error";
    chain: string;
    nonce?: string; 
    timestamp: string;
    error_code?: string;
    error_message?: string;
  };
};

export type EventPayload<T extends ResponseEvent = ResponseEvent> =
  T extends ResponseEvent.MiniAppVerifyAction
    ? MiniAppVerifyActionPayload
    : T extends ResponseEvent.MiniAppPaymentInitiated
    ? MiniAppPaymentInitiatedPayload
    : T extends ResponseEvent.MiniAppPaymentCompleted
    ? MiniAppPaymentCompletedPayload
    : unknown;

export type EventHandler<E extends ResponseEvent = ResponseEvent> = <
  T extends EventPayload<E>
>(
  data: T
) => void;
