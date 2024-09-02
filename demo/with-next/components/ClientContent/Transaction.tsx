import {
  MiniAppSendTransactionPayload,
  MiniKit,
  ResponseEvent,
  SendTransactionErrorCodes,
} from "@worldcoin/minikit-js";
import { useCallback, useEffect, useState } from "react";
import * as yup from "yup";
import { validateSchema } from "./helpers/validate-schema";
import USDCABI from "../../abi/USDC.json";

const sendTransactionSuccessPayloadSchema = yup.object({
  status: yup.string<"success">().oneOf(["success"]),
  transaction_status: yup.string<"submitted">().oneOf(["submitted"]),
  transaction_id: yup.string().required(),
  reference: yup.string().required(),
  from: yup.string().optional(),
  chain: yup.string().required(),
  timestamp: yup.string().required(),
});

const sendTransactionErrorPayloadSchema = yup.object({
  error_code: yup
    .string<SendTransactionErrorCodes>()
    .oneOf(Object.values(SendTransactionErrorCodes))
    .required(),
  status: yup.string<"error">().equals(["error"]).required(),
});

const testTokens = {
  optimism: {
    USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
  },
};

export const SendTransaction = () => {
  const [transactionData, setTransactionData] = useState<Record<
    string,
    any
  > | null>(null);
  const [receivedSendTransactionPayload, setReceivedSendTransactionPayload] =
    useState<Record<string, any> | null>(null);

  const [
    sendTransactionPayloadValidationMessage,
    setSendTransactionPayloadValidationMessage,
  ] = useState<string | null>();

  const [
    sendTransactionVerificationMessage,
    setSendTransactionVerificationMessage,
  ] = useState<string | null>();

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppSendTransaction,
      async (payload: MiniAppSendTransactionPayload) => {
        console.log("MiniAppSendTransaction, SUBSCRIBE PAYLOAD", payload);

        if (payload.status === "error") {
          const errorMessage = await validateSchema(
            sendTransactionErrorPayloadSchema,
            payload
          );

          if (!errorMessage) {
            setSendTransactionPayloadValidationMessage("Payload is valid");
          } else {
            setSendTransactionPayloadValidationMessage(errorMessage);
          }
        } else {
          const errorMessage = await validateSchema(
            sendTransactionSuccessPayloadSchema,
            payload
          );

          if (!errorMessage) {
            setSendTransactionPayloadValidationMessage("Payload is valid");
          } else {
            setSendTransactionPayloadValidationMessage(errorMessage);
          }

          // // Call the API to verify the message
          // const response = await fetch("/api/verify-siwe", {
          //   method: "POST",
          //   headers: {
          //     "Content-Type": "application/json",
          //   },
          //   body: JSON.stringify({
          //     siweResponsePayload: payload,
          //   }),
          // });

          // const responseJson = await response.json();

          // setSendTransactionVerificationMessage(
          //   responseJson.isValid
          //     ? "Valid! Successful Transaction"
          //     : `Failed: ${responseJson.message}`
          // );
        }
        setSendTransactionVerificationMessage("TODO");

        setReceivedSendTransactionPayload(payload);
      }
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSendTransaction);
    };
  }, []);

  const onSendTransactionClick = useCallback(() => {
    const deadline = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const payload = MiniKit.commands.sendTransaction({
      payload: [
        {
          to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          abi: USDCABI,
          functionName: "transferFrom",
          args: [2000000, "PERMIT2_SIGNATURE_PLACEHOLDER_1"],
        },
        {
          to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          abi: USDCABI,
          functionName: "transferFrom",
          args: [100000, "PERMIT2_SIGNATURE_PLACEHOLDER_2"],
        },
      ],
      permit2: [
        {
          deadline: deadline,
          token_address: testTokens.optimism.USDC,
          amount: "100000000",
        },
        {
          deadline: deadline,
          token_address: testTokens.optimism.USDC,
          amount: "100000000",
        },
      ],
    });
    setTransactionData(payload);
  }, []);

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Transaction</h2>

      <div className="grid gap-y-1">
        <p>Raw string:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces max-h-[300px] overflow-y-scroll">
            {transactionData
              ? JSON.stringify(transactionData, null, 3)
              : JSON.stringify(null)}
          </pre>
        </div>
      </div>

      <button
        className="bg-black text-white rounded-lg p-4 w-full"
        onClick={onSendTransactionClick}
      >
        Send Transaction
      </button>

      <div className="grid gap-y-1">
        <p>
          Received from &quot;{ResponseEvent.MiniAppSendTransaction}&quot;:{" "}
        </p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(receivedSendTransactionPayload, null, 2)}
          </pre>
        </div>

        <div className="grid gap-y-1">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {sendTransactionPayloadValidationMessage ?? "No validation"}
          </p>
        </div>

        <div className="grid gap-y-1">
          <p>Verification:</p>
          <p className="bg-gray-300 p-2">
            {sendTransactionVerificationMessage ?? "No verification yet"}
          </p>
        </div>
      </div>
    </div>
  );
};
