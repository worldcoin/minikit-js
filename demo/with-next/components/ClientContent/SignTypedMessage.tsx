import {
  MiniKit,
  SignTypedDataErrorCodes,
  ResponseEvent,
  MiniAppSignTypedDataPayload,
} from "@worldcoin/minikit-js";
import { useCallback, useEffect, useState } from "react";
import { validateSchema } from "./helpers/validate-schema";
import * as yup from "yup";
import { SignTypedDataInput } from "../../../../src/types/commands";
import { verifyMessage } from "@wagmi/core";
import { config } from "../config";
import { MiniAppSignMessagePayload } from "../../../../src";

const signTypedDataSuccessPayloadSchema = yup.object({
  message: yup.string().required(),
  status: yup.string<"success">().oneOf(["success"]),
  signature: yup.string().required(),
  address: yup.string().required(),
});

const signTypedDataErrorPayloadSchema = yup.object({
  error_code: yup
    .string<SignTypedDataErrorCodes>()
    .oneOf(Object.values(SignTypedDataErrorCodes))
    .required(),
  status: yup.string<"error">().equals(["error"]).required(),
  version: yup.number().required(),
});

export const SignTypedData = () => {
  const [signTypedDataAppPayload, setSignTypedDataAppPayload] = useState<
    string | undefined
  >();

  const [
    signTypedDataPayloadValidationMessage,
    setSignTypedDataPayloadValidationMessage,
  ] = useState<string | null>();

  const [
    signTypedDataPayloadVerificaitonMessage,
    setSignTypedDataPayloadVerificationMessage,
  ] = useState<string | null>();

  const [sentSignTypedDataPayload, setSentSignTypedDataPayload] =
    useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppSignTypedData,
      async (payload: MiniAppSignTypedDataPayload) => {
        console.log("MiniAppSignTypedData, SUBSCRIBE PAYLOAD", payload);

        if (payload.status === "error") {
          const errorMessage = await validateSchema(
            signTypedDataErrorPayloadSchema,
            payload
          );

          if (!errorMessage) {
            setSignTypedDataPayloadValidationMessage("Payload is valid");
          } else {
            setSignTypedDataPayloadValidationMessage(errorMessage);
          }
        } else {
          const errorMessage = await validateSchema(
            signTypedDataSuccessPayloadSchema,
            payload
          );

          if (!errorMessage) {
            setSignTypedDataPayloadValidationMessage("Payload is valid");
          } else {
            setSignTypedDataPayloadValidationMessage(errorMessage);
          }
        }

        const isValid = await verifyMessage(config, {
          address: "0x4564420674EA68fcc61b463C0494807C759d47e6",
          message: "hello world",
          signature:
            "0x654c6c04ba9496731e26f92b74a0de100e2dc72e0ae646698d5f8ed68c2b9db03bb46a772843608717d8ba3d8ae1d4a330bc97315b14397d9216b45b3834351d1b",
        });

        setSignTypedDataAppPayload(JSON.stringify(payload, null, 2));
        setSignTypedDataPayloadVerificationMessage(
          isValid ? "Signature is valid" : "Signature is invalid"
        );
      }
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSignTypedData);
    };
  }, []);

  const onSignTypedData = useCallback(async () => {
    const signTypedDataPayload: SignTypedDataInput = {
      types: {
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
        ],
        Mail: [
          { name: "from", type: "Person" },
          { name: "to", type: "Person" },
          { name: "contents", type: "string" },
        ],
      },
      primaryType: "Mail",
      message: {
        from: {
          name: "Cow",
          wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
        },
        to: {
          name: "Bob",
          wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
        },
        contents: "Hello, Bob!",
      },
    };

    const payload = MiniKit.commands.signTypedData(signTypedDataPayload);

    setSentSignTypedDataPayload({
      payload,
    });
  }, []);

  return (
    <div>
      <div className="grid gap-y-2">
        <h2 className="text-2xl font-bold">Sign Typed Data</h2>

        <div>
          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces max-h-[250px] overflow-y-scroll ">
              {JSON.stringify(sentSignTypedDataPayload, null, 2)}
            </pre>
          </div>
        </div>
        <button
          className="bg-black text-white rounded-lg p-4 w-full"
          onClick={onSignTypedData}
        >
          Sign Message
        </button>
      </div>

      <hr />

      <div className="w-full grid gap-y-2">
        <p>Message from &quot;{ResponseEvent.MiniAppSignTypedData}&quot; </p>

        <div className="bg-gray-300 min-h-[100px] p-2">
          <pre className="break-all whitespace-break-spaces">
            {signTypedDataAppPayload ?? JSON.stringify(null)}
          </pre>
        </div>

        <div className="grid gap-y-2">
          <p>Validation message:</p>
          <p className="bg-gray-300 p-2">
            {signTypedDataPayloadValidationMessage ?? "No validation"}
          </p>
        </div>
        <div>
          <p>Verification message:</p>
          <p className="bg-gray-300 p-2">
            {signTypedDataPayloadValidationMessage ?? "No validation"}
          </p>
        </div>
      </div>
    </div>
  );
};
