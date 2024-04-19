"use client";

import {
  MiniKit,
  ResponseEvent,
  VerificationLevel,
} from "@worldcoin/minikit-js";
import { signIn, signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as yup from "yup";

const verifyActionPayloadSchema = yup.object({
  status: yup
    .string<"success" | "error">()
    .oneOf(["success", "error"])
    .required(),
  error_code: yup.string().required(),
  error_message: yup.string().required(),
  proof: yup.string().required(),
  merkle_root: yup.string().required(),
  nullifier_hash: yup.string().required(),
  verification_level: yup
    .string<VerificationLevel>()
    .oneOf(Object.values(VerificationLevel))
    .required(),
});

const paymentInitiatedPayloadSchema = yup.object({
  transaction_hash: yup.string().required(),
  status: yup.string<"completed" | "error">().oneOf(["completed", "error"]),
  chain: yup.string().required(),
  nonce: yup.string().optional(),
  timestamp: yup.string().required(),
  error_code: yup.string().optional(),
  error_message: yup.string().optional(),
});

const paymentCompletedPayloadSchema = yup.object({
  transaction_hash: yup.string().required(),
  "status:": yup.string<"completed" | "error">().oneOf(["completed", "error"]),
  chain: yup.string().required(),
  nonce: yup.string().optional(),
  timestamp: yup.string().required(),
  error_code: yup.string().optional(),
  error_message: yup.string().optional(),
});

const validatePayload = async (
  schema: yup.ObjectSchema<any>,
  payload: any
): Promise<string | null> => {
  let errorMessage: string | null = null;

  try {
    await schema.validate(payload);
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) {
      errorMessage = "Unknown error";
      return errorMessage;
    }

    errorMessage = error.message;
  }

  return errorMessage;
};

export const ClientContent = () => {
  const [verifyActionAppPayload, setVerifyActionAppPayload] = useState<
    string | undefined
  >();

  const [
    verifyActionAppPayloadValidationMessage,
    setVerifyActionAppPayloadValidationMessage,
  ] = useState<string | null>(null);

  const [paymentInitiatedAppPayload, setPaymentInitiatedAppPayload] = useState<
    string | undefined
  >();

  const [
    paymentInitiatedAppPayloadValidationMessage,
    setPaymentInitiatedAppPayloadValidationMessage,
  ] = useState<string | null>();

  const [paymentCompletedAppPayload, setPaymentCompletedAppPayload] = useState<
    string | undefined
  >();

  const [
    paymentCompletedAppPayloadValidationMessage,
    setPaymentCompletedAppPayloadValidationMessage,
  ] = useState<string | null>();

  const [sentVerifyPayload, setSentVerifyPayload] = useState<Record<
    string,
    any
  > | null>(null);

  const [sentPayPayload, setSentPayPayload] = useState<Record<
    string,
    any
  > | null>(null);

  const { data: session } = useSession();
  const user = useMemo(() => session?.user, [session]);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, async (payload) => {
      console.log("MiniAppVerifyAction, SUBSCRIBE PAYLOAD", payload);
      const errorMessage = await validatePayload(
        verifyActionPayloadSchema,
        payload
      );

      if (!errorMessage) {
        setVerifyActionAppPayloadValidationMessage("Payload is valid");
      } else {
        setVerifyActionAppPayloadValidationMessage(errorMessage);
      }

      setVerifyActionAppPayload(JSON.stringify(payload, null, 2));
    });

    MiniKit.subscribe(
      ResponseEvent.MiniAppPaymentInitiated,
      async (payload) => {
        console.log("MiniAppPaymentInitiated, SUBSCRIBE PAYLOAD", payload);

        const errorMessage = await validatePayload(
          paymentInitiatedPayloadSchema,
          payload
        );

        if (!errorMessage) {
          setPaymentInitiatedAppPayloadValidationMessage("Payload is valid");
        } else {
          setPaymentInitiatedAppPayloadValidationMessage(errorMessage);
        }

        setPaymentInitiatedAppPayload(JSON.stringify(payload, null, 2));
      }
    );

    MiniKit.subscribe(
      ResponseEvent.MiniAppPaymentCompleted,
      async (payload) => {
        console.log("MiniAppPaymentCompleted, SUBSCRIBE PAYLOAD", payload);

        const errorMessage = await validatePayload(
          paymentCompletedPayloadSchema,
          payload
        );

        if (!errorMessage) {
          setPaymentCompletedAppPayloadValidationMessage("Payload is valid");
        } else {
          setPaymentCompletedAppPayloadValidationMessage(errorMessage);
        }

        setPaymentCompletedAppPayload(JSON.stringify(payload, null, 2));
      }
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction);
      MiniKit.unsubscribe(ResponseEvent.MiniAppPaymentInitiated);
      MiniKit.unsubscribe(ResponseEvent.MiniAppPaymentCompleted);
    };
  }, []);

  const onVerifyClick = useCallback(() => {
    const verifyPayload = {
      app_id: process.env.NEXT_PUBLIC_VERIFY_APP_ID as `app_${string}`,
      action: process.env.NEXT_PUBLIC_VERIFY_ACTION as string,
      signal: "signal",
      verification_level: VerificationLevel.Device,
      timestamp: new Date().toISOString(),
    };

    MiniKit.commands.verify(verifyPayload);
    setSentVerifyPayload(verifyPayload);
  }, []);

  const onPayclick = useCallback(() => {
    const payPayload = {
      to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      from: "0x6235379BAf4644cCBd22e9F6C53D35a1CF727D4C",
      value: 200.13,
      network: "optimism",
      token_address: "0x163f8C2467924be0ae7B5347228CABF260318753",
      token: "wld",
      timestamp: new Date().toISOString(),
    };

    MiniKit.commands.pay(payPayload);
    setSentPayPayload(payPayload);
  }, []);

  return (
    <div className="p-2 lg:p-8 grid content-start min-h-[100dvh] gap-y-2">
      <header className="flex justify-between">
        <h1 className="text-2xl font-bold">MiniKit V1</h1>

        <button
          onClick={user?.name ? () => signOut() : () => signIn("worldcoin")}
          className="text-white bg-blue-500 hover:bg-blue-300 transition p-4 leading-[1]"
        >
          {user?.name ? "Sign Out" : "Sign In"}
        </button>
      </header>

      <hr />

      <div className="grid gap-y-4 content-start">
        <div>
          <h2>Session User:</h2>
          {user?.name ? (
            <p className="truncate">
              User name:{" "}
              <span className="font-bold max-w-full truncate">
                {user?.name}
              </span>
            </p>
          ) : (
            <span className="font-bold">No user</span>
          )}
        </div>

        <hr />

        <div className="grid gap-y-8">
          <div className="grid gap-y-2">
            <h2>Verify action:</h2>

            <div>
              <p>Sent payload:</p>

              <div className="bg-gray-300 min-h-[100px] p-2">
                <pre className="break-all whitespace-break-spaces">
                  {JSON.stringify(sentVerifyPayload, null, 2)}
                </pre>
              </div>
            </div>

            <button
              className="bg-black text-white rounded-lg p-4 w-full"
              onClick={onVerifyClick}
            >
              Send verify
            </button>
          </div>

          <hr />

          <div className="grid gap-y-2">
            <h2>Pay action:</h2>

            <div>
              <p>Sent payload:</p>

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
            <p>Message from &quot;{ResponseEvent.MiniAppVerifyAction}&quot; </p>

            <div className="bg-gray-300 min-h-[100px] p-2">
              <pre className="break-all whitespace-break-spaces">
                {verifyActionAppPayload ?? JSON.stringify(null)}
              </pre>
            </div>

            <div className="grid gap-y-2">
              <p>Validation message:</p>
              <p className="bg-gray-300 p-2">
                {verifyActionAppPayloadValidationMessage ?? "No validation"}
              </p>
            </div>
          </div>

          <hr />

          <div className="w-full grid gap-y-2">
            <p>
              Message from &quot;{ResponseEvent.MiniAppPaymentInitiated}&quot;{" "}
            </p>

            <div className="bg-gray-300 min-h-[100px] p-2">
              <pre className="break-all whitespace-break-spaces">
                {paymentInitiatedAppPayload ?? JSON.stringify(null)}
              </pre>
            </div>

            <div className="grid gap-y-2">
              <p>Validation message:</p>
              <p className="bg-gray-300 p-2">
                {paymentInitiatedAppPayloadValidationMessage ?? "No validation"}
              </p>
            </div>
          </div>

          <hr />

          <div className="w-full grid gap-y-2">
            <p>
              Message from &quot;{ResponseEvent.MiniAppPaymentCompleted}&quot;{" "}
            </p>

            <div className="bg-gray-300 min-h-[100px] p-2">
              <pre className="break-all whitespace-break-spaces">
                {paymentCompletedAppPayload ?? JSON.stringify(null)}
              </pre>
            </div>

            <div className="grid gap-y-2">
              <p>Validation message:</p>
              <p className="bg-gray-300 p-2">
                {paymentCompletedAppPayloadValidationMessage ?? "No validation"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
