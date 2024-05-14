"use server";

import { IDKitConfig, ISuccessResult } from "@worldcoin/idkit-core";

import {
  IVerifyResponse,
  verifyCloudProof,
} from "@worldcoin/idkit-core/backend";

export const verifyProof = async (params: {
  app_id: IDKitConfig["app_id"];
  action: string;
  payload: ISuccessResult;
}) => {
  const { app_id, action, payload } = params;
  let verifyResponse: IVerifyResponse | null = null;
  const stagingEndpoint = `${process.env.NEXT_SERVER_STAGING_DEV_PORTAL_URL}/api/v2/verify/${app_id}`;

  try {
    verifyResponse = await verifyCloudProof(
      payload,
      app_id,
      action,
      undefined,

      process.env.NEXT_DEPLOYMENT_ENVIRONMENT === "staging"
        ? stagingEndpoint
        : undefined
    );
  } catch (error) {
    console.log("Error in verifyCloudProof", error);
  }

  return verifyResponse;
};
