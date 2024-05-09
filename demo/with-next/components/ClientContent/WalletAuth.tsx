import {
  MiniKit,
  ResponseEvent,
  WalletAuthErrorCodes,
} from "@worldcoin/minikit-js";
import { useCallback, useEffect, useState } from "react";
import * as yup from "yup";
import { validateSchema } from "./helpers/validate-schema";

const walletAuthSuccessPayloadSchema = yup.object({
  status: yup.string<"success">().oneOf(["success"]),
  message: yup.string().required(),
  signature: yup.string().required(),
  address: yup.string().required(),
});

const walletAuthErrorPayloadSchema = yup.object({
  error_code: yup
    .string<WalletAuthErrorCodes>()
    .oneOf(Object.values(WalletAuthErrorCodes))
    .required(),
  status: yup.string<"error">().equals(["error"]).required(),
});

export const WalletAuth = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [receivedWalletAuthPayload, setReceivedWalletAuthPayload] =
    useState<Record<string, any> | null>(null);

  const [
    walletAuthPayloadValidationMessage,
    setWalletAuthPayloadValidationMessage,
  ] = useState<string | null>();

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppWalletAuth, async (payload) => {
      console.log("MiniAppWalletAuth, SUBSCRIBE PAYLOAD", payload);

      if (payload.status === "error") {
        const errorMessage = await validateSchema(
          walletAuthErrorPayloadSchema,
          payload
        );

        if (!errorMessage) {
          setWalletAuthPayloadValidationMessage("Payload is valid");
        } else {
          setWalletAuthPayloadValidationMessage(errorMessage);
        }
      } else {
        const errorMessage = await validateSchema(
          walletAuthSuccessPayloadSchema,
          payload
        );

        if (!errorMessage) {
          setWalletAuthPayloadValidationMessage("Payload is valid");
        } else {
          setWalletAuthPayloadValidationMessage(errorMessage);
        }
      }

      setReceivedWalletAuthPayload(payload);
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppWalletAuth);
    };
  }, []);

  const onGenerateMessageClick = useCallback(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    const generateMessageResult = MiniKit.commands.walletAuth({
      nonce: window.crypto.randomUUID(),
      statement: "statement",
      requestId: "0",
      expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    });

    if (!generateMessageResult) {
      return setGenerationError("Failed to generate message");
    }

    return setMessage(generateMessageResult.siweMessage);
  }, []);

  return (
    <div className="grid gap-y-2">
      <h2 className="text-2xl font-bold">Wallet Auth</h2>

      <div className="grid gap-y-1">
        <p>Raw string:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-pre-line">
            {(message ? JSON.stringify(message) : generationError) ??
              JSON.stringify(null)}
          </pre>
        </div>
      </div>

      <div className="grid gap-y-1">
        <p>Beautified string:</p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {message ?? generationError ?? JSON.stringify(null)}
          </pre>
        </div>
      </div>

      <button
        className="bg-black text-white rounded-lg p-4 w-full"
        onClick={onGenerateMessageClick}
      >
        Generate message
      </button>

      <div className="grid gap-y-1">
        <p>Received from &quot;{ResponseEvent.MiniAppWalletAuth}&quot;: </p>
        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {JSON.stringify(receivedWalletAuthPayload, null, 2)}
          </pre>
        </div>

        <div className="grid gap-y-1">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {walletAuthPayloadValidationMessage ?? "No validation"}
          </p>
        </div>
      </div>
    </div>
  );
};