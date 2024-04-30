import {
  MiniKit,
  PayCommandInput,
  PaymentErrorCodes,
  ResponseEvent,
  Tokens,
  tokenToDecimals,
} from "@worldcoin/minikit-js";
import { useCallback, useEffect, useState } from "react";
import { validateSchema } from "./helpers/validate-schema";
import * as yup from "yup";

const paymentSuccessPayloadSchema = yup.object({
  status: yup.string<"success">().oneOf(["success"]),
  transaction_status: yup.string<"submitted">().oneOf(["submitted"]),
  reference: yup.string().required(),
  from: yup.string().optional(),
  chain: yup.string().required(),
  timestamp: yup.string().required(),
});

const paymentErrorPayloadSchema = yup.object({
  error_code: yup
    .string<PaymentErrorCodes>()
    .oneOf(Object.values(PaymentErrorCodes))
    .required(),
  status: yup.string<"error">().equals(["error"]).required(),
});

export const Pay = () => {
  const [paymentAppPayload, setPaymentAppPayload] = useState<
    string | undefined
  >();

  const [paymentPayloadValidationMessage, setPaymentPayloadValidationMessage] =
    useState<string | null>();

  const [sentPayPayload, setSentPayPayload] = useState<Record<
    string,
    any
  > | null>(null);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppPayment, async (payload) => {
      console.log("MiniAppPayment, SUBSCRIBE PAYLOAD", payload);

      if (payload.status === "error") {
        const errorMessage = await validateSchema(
          paymentErrorPayloadSchema,
          payload
        );

        if (!errorMessage) {
          setPaymentPayloadValidationMessage("Payload is valid");
        } else {
          setPaymentPayloadValidationMessage(errorMessage);
        }
      } else {
        const errorMessage = await validateSchema(
          paymentSuccessPayloadSchema,
          payload
        );

        if (!errorMessage) {
          setPaymentPayloadValidationMessage("Payload is valid");
        } else {
          setPaymentPayloadValidationMessage(errorMessage);
        }
      }

      setPaymentAppPayload(JSON.stringify(payload, null, 2));
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppPayment);
    };
  }, []);

  const onPayclick = useCallback(async () => {
    const tokenAmount = tokenToDecimals(200.13, Tokens.USDC);
    const req = await fetch("/api/prepare-payment", {
      method: "GET",
    });
    const res = await req.json();
    const payPayload: PayCommandInput = {
      to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      token_amount: tokenAmount,
      token: Tokens.USDC,
      description: "Test example payment for minikit",
      reference: res.body.referenceId,
    };

    const payload = MiniKit.commands.pay(payPayload);
    setSentPayPayload({
      payload,
    });
  }, []);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Pay</h2>

        <div>
          <p>Sent payload: Spec is still WIP</p>

          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(sentPayPayload, null, 2)}
            </pre>
          </div>
        </div>

        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onPayclick}
        >
          Send pay
        </button>
      </div>

      <hr />

      <div className="w-full grid gap-y-2">
        <p>Message from &quot;{ResponseEvent.MiniAppPayment}&quot; </p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {paymentAppPayload ?? JSON.stringify(null)}
          </pre>
        </div>

        <div className="grid gap-y-2">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {paymentPayloadValidationMessage ?? "No validation"}
          </p>
        </div>
      </div>
    </div>
  );
};
