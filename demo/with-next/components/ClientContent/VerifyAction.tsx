import { IDKitConfig, VerificationLevel } from "@worldcoin/idkit-core";
import { verifyCloudProof } from "@worldcoin/idkit-core/backend";
import { MiniKit, ResponseEvent } from "@worldcoin/minikit-js";
import { useCallback, useEffect, useState } from "react";
import * as yup from "yup";
import { validateSchema } from "./helpers/validate-schema";

const verifySignal = "signal";

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

export const VerifyAction = () => {
  const [
    verifyActionAppPayloadValidationMessage,
    setVerifyActionAppPayloadValidationMessage,
  ] = useState<string | null>(null);

  const [verifyActionAppPayload, setVerifyActionAppPayload] = useState<
    Record<string, any> | undefined
  >();

  const [sentVerifyPayload, setSentVerifyPayload] = useState<Record<
    string,
    any
  > | null>(null);

  const [devPortalVerifyResponse, setDevPortalVerifyResponse] = useState<Record<
    string,
    any
  > | null>(null);

  const [lastUsedAppId, setLastUsedAppId] = useState<
    IDKitConfig["app_id"] | null
  >(null);

  const [lastUsedAction, setLastUsedAction] = useState<string | null>(null);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppVerifyAction, async (payload) => {
      if (payload.payload.status === "error") {
        return console.log("Error payload", payload);
      }

      console.log("MiniAppVerifyAction, SUBSCRIBE PAYLOAD", payload);

      const errorMessage = await validateSchema(
        verifyActionPayloadSchema,
        payload
      );

      if (errorMessage) {
        return setVerifyActionAppPayloadValidationMessage(errorMessage);
      }

      setVerifyActionAppPayloadValidationMessage("Payload is valid");

      if (!lastUsedAppId || !lastUsedAction) {
        return console.log("lastUsedAppId or lastUsedAction is not set");
      }

      const verifyResponse = await verifyCloudProof(
        {
          proof: payload.payload.proof,
          merkle_root: payload.payload.merkle_root,
          nullifier_hash: payload.payload.nullifier_hash,
          verification_level: payload.payload.verification_level,
        },
        lastUsedAppId,
        lastUsedAction
      );

      setDevPortalVerifyResponse(verifyResponse);
      setVerifyActionAppPayload(payload);
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction);
    };
  }, [lastUsedAction, lastUsedAppId]);

  const verifyAction = useCallback(
    (params: { app_id: IDKitConfig["app_id"]; action: string }) => {
      setLastUsedAppId(params.app_id);
      setLastUsedAction(params.action);

      const verifyPayload = {
        app_id: params.app_id,
        action: params.action,
        signal: verifySignal,
        verification_level: VerificationLevel.Device,
        timestamp: new Date().toISOString(),
      };

      MiniKit.commands.verify(verifyPayload);
      setSentVerifyPayload(verifyPayload);
    },
    []
  );

  const onProdVerifyClick = useCallback(() => {
    verifyAction({
      app_id: process.env
        .NEXT_PUBLIC_PROD_VERIFY_APP_ID as IDKitConfig["app_id"],

      action: process.env.NEXT_PUBLIC_PROD_VERIFY_ACTION as string,
    });
  }, [verifyAction]);

  const onStagingVerifyClick = useCallback(() => {
    verifyAction({
      app_id: process.env
        .NEXT_PUBLIC_STAGING_VERIFY_APP_ID as IDKitConfig["app_id"],

      action: process.env.NEXT_PUBLIC_STAGING_VERIFY_ACTION as string,
    });
  }, [verifyAction]);

  return (
    <div className="grid gap-y-4">
      <h2 className="font-bold text-2xl">Verify</h2>

      <div className="grid gap-y-12">
        <div className="grid gap-y-2">
          <div>
            <p>Sent payload:</p>

            <div className="bg-gray-300 min-h-[100px] p-2">
              <pre className="break-all whitespace-break-spaces">
                {JSON.stringify(sentVerifyPayload, null, 2)}
              </pre>
            </div>
          </div>

          <div className="grid gap-y-2">
            <button
              className="bg-black text-white rounded-lg p-4 w-full"
              onClick={onProdVerifyClick}
            >
              Send production app verify
            </button>

            <button
              className="bg-black text-white rounded-lg p-4 w-full"
              onClick={onStagingVerifyClick}
            >
              Send staging app verify
            </button>
          </div>
        </div>

        <div className="w-full grid gap-y-2">
          <p>Message from &quot;{ResponseEvent.MiniAppVerifyAction}&quot; </p>

          <div className="bg-gray-300 min-h-[100px] p-2">
            <pre className="break-all whitespace-break-spaces">
              {JSON.stringify(verifyActionAppPayload, null, 2) ??
                JSON.stringify(null)}
            </pre>
          </div>

          <div className="grid gap-y-2">
            <p>Validation message:</p>
            <p className="bg-gray-300 p-2">
              {verifyActionAppPayloadValidationMessage ?? "No validation"}
            </p>
          </div>

          <div className="grid gap-y-2">
            <p>`DEV_PORTAL/api/v2/verify` Response:</p>
            <pre className="break-all whitespace-break-spaces bg-gray-300 p-2">
              {JSON.stringify(devPortalVerifyResponse, null, 2) ??
                "No validation"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
