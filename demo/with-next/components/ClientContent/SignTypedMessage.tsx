import {
  MiniKit,
  SignTypedDataErrorCodes,
  ResponseEvent,
  MiniAppSignTypedDataPayload,
  SignTypedDataInput,
} from "@worldcoin/minikit-js";
import { useCallback, useEffect, useState } from "react";
import { validateSchema } from "./helpers/validate-schema";
import * as yup from "yup";
import { verifyMessage } from "@wagmi/core";
import { config } from "../config";
import Safe, { hashSafeMessage } from "@safe-global/protocol-kit";

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

const signTypedDataPayload = {
  "types":{
     "EIP712Domain":[
        {
           "name":"name",
           "type":"string"
        },
        {
           "name":"version",
           "type":"string"
        },
        {
           "name":"chainId",
           "type":"uint256"
        },
        {
           "name":"verifyingContract",
           "type":"address"
        }
     ],
     "Person":[
        {
           "name":"name",
           "type":"string"
        },
        {
           "name":"wallet",
           "type":"address"
        }
     ],
     "Mail":[
        {
           "name":"from",
           "type":"Person"
        },
        {
           "name":"to",
           "type":"Person"
        },
        {
           "name":"contents",
           "type":"string"
        }
     ]
  },
  "primaryType":"Mail",
  "domain":{
     "name":"Ether Mail",
     "version":"1",
     "chainId":1,
     "verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
  },
  "message":{
     "from":{
        "name":"Cow",
        "wallet":"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
     },
     "to":{
        "name":"Bob",
        "wallet":"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
     },
     "contents":"Hello, Bob!"
  }
};

export const SignTypedData = () => {
  const [signTypedDataAppPayload, setSignTypedDataAppPayload] = useState<
    string | undefined
  >();

  const [
    signTypedDataPayloadValidationMessage,
    setSignTypedDataPayloadValidationMessage,
  ] = useState<string | null>();

  const [
    signTypedDataPayloadVerificationMessage,
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

          setSignTypedDataAppPayload(JSON.stringify(payload, null, 2));
          
          // This checks if the response format is correct
          if (!errorMessage) {
            setSignTypedDataPayloadValidationMessage("Payload is valid");
          } else {
            setSignTypedDataPayloadValidationMessage(errorMessage);
          }

          const messageHash = hashSafeMessage(signTypedDataPayload)

          const isValid = await (await Safe.init({
            provider: "https://opt-mainnet.g.alchemy.com/v2/Ha76ahWcm6iDVBU7GNr5n-ONLgzWnkWc",
            safeAddress: payload.address,
          })).isValidSignature(
            messageHash,
            payload.signature,
          )

          // Checks functionally if the signature is correct
          if(isValid) {
            setSignTypedDataPayloadVerificationMessage("Signature is valid")
          } else {
            setSignTypedDataPayloadVerificationMessage("Signature is invalid (We are verifying on optimism, if you are using worldchain message andy")
          }
        }
      }
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSignTypedData);
    };
  }, []);

  const onSignTypedData = useCallback(async () => {
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
          Sign Typed Data
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
        <p>Check does signature verify:</p>
        <p className="bg-gray-300 p-2">
            {signTypedDataPayloadVerificationMessage ?? "No verification"}
          </p>
        </div>
      </div>
    </div>
  );
};
