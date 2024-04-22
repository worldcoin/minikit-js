import { PaymentErrorMessage } from "types/errors";
import {
  MiniAppPaymentErrorPayload,
  MiniAppPaymentOkPayload,
} from "types/responses";

const worldAppSigningKey =
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

// This function is used to verify an incoming payment event from the Mini App.
export const verifySignature = async (
  referenceId: string,
  payload: MiniAppPaymentOkPayload
): Promise<boolean> => {
  if (typeof window !== "undefined") {
    throw new Error(
      "Signature verification should only be performed on the backend."
    );
  }

  // Verify Signature

  // Check date is not more than 2 minutes old
  const date = new Date(payload.payload.timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff > 120000) {
    throw new Error("Timestamp is too old");
  }

  return true;
};

export const getPaymentErrorMessage = (
  payload: MiniAppPaymentErrorPayload
): void => {
  return PaymentErrorMessage[payload.payload.error_code];
};

export const createReferenceId = (): string => {
  const buffer = new Uint8Array(32); // Create a buffer of 32 bytes (256 bits)
  crypto.getRandomValues(buffer);
  const referenceId =
    "0x" +
    Array.from(buffer)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  return referenceId;
};
