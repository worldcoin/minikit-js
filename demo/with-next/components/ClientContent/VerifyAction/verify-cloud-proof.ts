"use server";

import {
  ISuccessResult,
  IVerifyResponse,
  verifyCloudProof,
} from "@worldcoin/minikit-js";

export const verifyProof = async (params: {
  app_id: `app_${string}`;
  action: string;
  signal: string;
  payload: ISuccessResult;
}) => {
  const { app_id, action, payload, signal } = params;
  let verifyResponse: IVerifyResponse | null = null;
  const stagingEndpoint = `${process.env.NEXT_SERVER_STAGING_DEV_PORTAL_URL}/api/v1/verify/${app_id}`;
  const productionEndpoint = `${process.env.NEXT_SERVER_PROD_DEV_PORTAL_URL}/api/v1/verify/${app_id}`;

  try {
    // verifyResponse = await verifyCloudProof(
    //   payload,
    //   app_id,
    //   action,
    //   signal,

    //   process.env.NEXT_DEPLOYMENT_ENVIRONMENT === "staging"
    //     ? stagingEndpoint
    //     : undefined
    // );
    console.log(payload, app_id, action, signal);
    const response = await fetch(productionEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload,
        app_id,
        action,
        signal,
      }),
    });
    console.log("verifyResponse", response);
  } catch (error) {
    console.log("Error in verifyCloudProof", error);
  }

  return verifyResponse;
};
