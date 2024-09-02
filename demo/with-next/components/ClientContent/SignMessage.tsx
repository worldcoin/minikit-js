import {
  MiniKit,
  SignMessageErrorCodes,
  ResponseEvent,
} from "@worldcoin/minikit-js";
import { useCallback, useEffect, useState } from "react";
import { validateSchema } from "./helpers/validate-schema";
import * as yup from "yup";
import { SignMessageInput } from "../../../../src/types/commands";
import { verifyMessage } from "@wagmi/core";
import { config } from "../config";
import { optimism } from "@wagmi/core/chains";

const signMessageSuccessPayloadSchema = yup.object({
  message: yup.string().required(),
  status: yup.string<"success">().oneOf(["success"]),
  signature: yup.string().required(),
  address: yup.string().required(),
});

const signMessageErrorPayloadSchema = yup.object({
  error_code: yup
    .string<SignMessageErrorCodes>()
    .oneOf(Object.values(SignMessageErrorCodes))
    .required(),
  status: yup.string<"error">().equals(["error"]).required(),
  version: yup.number().required(),
});

export const SignMessage = () => {
  const [signMessageAppPayload, setSignMessageAppPayload] = useState<
    string | undefined
  >();

  const [
    signMessagePayloadValidationMessage,
    setSignMessagePayloadValidationMessage,
  ] = useState<string | null>();

  const [
    signMessagePayloadVerificaitonMessage,
    setSignMessagePayloadVerificationMessage,
  ] = useState<string | null>();

  const [sentSignMessagePayload, setSentSignMessagePayload] = useState<Record<
    string,
    any
  > | null>(null);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppSignMessage, async (payload) => {
      console.log("MiniAppSignMessage, SUBSCRIBE PAYLOAD", payload);

      if (payload.status === "error") {
        const errorMessage = await validateSchema(
          signMessageErrorPayloadSchema,
          payload
        );

        if (!errorMessage) {
          setSignMessagePayloadValidationMessage("Payload is valid");
        } else {
          setSignMessagePayloadValidationMessage(errorMessage);
        }
      } else {
        const errorMessage = await validateSchema(
          signMessageSuccessPayloadSchema,
          payload
        );

        if (!errorMessage) {
          setSignMessagePayloadValidationMessage("Payload is valid");
        } else {
          setSignMessagePayloadValidationMessage(errorMessage);
        }
      }

      const isValid = await verifyMessage(config, {
        address: "0x4564420674EA68fcc61b463C0494807C759d47e6",
        message: "hello world",
        signature:
          "0x654c6c04ba9496731e26f92b74a0de100e2dc72e0ae646698d5f8ed68c2b9db03bb46a772843608717d8ba3d8ae1d4a330bc97315b14397d9216b45b3834351d1b",
      });

      setSignMessageAppPayload(JSON.stringify(payload, null, 2));
      setSignMessagePayloadVerificationMessage(
        isValid ? "Signature is valid" : "Signature is invalid"
      );
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSignMessage);
    };
  }, []);

  const onSignMessage = useCallback(async () => {
    const signMessagePayload: SignMessageInput = {
      message: "hello world",
    };

    const payload = MiniKit.commands.signMessage(signMessagePayload);
    console.log(
      await verifyMessage(config, {
        address: "0x4564420674EA68fcc61b463C0494807C759d47e6",
        message: "hello world",
        chainId: optimism.id,
        signature:
          "0x654c6c04ba9496731e26f92b74a0de100e2dc72e0ae646698d5f8ed68c2b9db03bb46a772843608717d8ba3d8ae1d4a330bc97315b14397d9216b45b3834351d1b",
      })
    );
    setSentSignMessagePayload({
      payload,
    });
  }, []);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Sign Message</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(sentSignMessagePayload, null, 2)}
            </pre>
          </div>
        </div>
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onSignMessage}
        >
          Sign Message
        </button>
      </div>

      <hr />

      <div className="w-full grid gap-y-2">
        <p>Message from &quot;{ResponseEvent.MiniAppSignMessage}&quot; </p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {signMessageAppPayload ?? JSON.stringify(null)}
          </pre>
        </div>

        <div className="grid gap-y-2">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {signMessagePayloadValidationMessage ?? "No validation"}
          </p>
        </div>
        <div>
          <p>Verification message:</p>
          <p className="bg-gray-300 p-2">
            {signMessagePayloadValidationMessage ?? "No validation"}
          </p>
        </div>
      </div>
    </div>
  );
};
