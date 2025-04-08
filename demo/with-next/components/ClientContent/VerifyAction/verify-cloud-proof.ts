'use server';

import {
  ISuccessResult,
  IVerifyResponse,
  verifyCloudProof,
} from '@worldcoin/minikit-js';

export const verifyProof = async (params: {
  app_id: `app_${string}`;
  action: string;
  signal?: string;
  payload: ISuccessResult;
}) => {
  const { app_id, action, payload, signal } = params;
  let verifyResponse: IVerifyResponse | null = null;
  const stagingEndpoint = `${process.env.NEXT_SERVER_DEV_PORTAL_URL}/api/v2/verify/${app_id}`;

  try {
    verifyResponse = await verifyCloudProof(
      payload,
      app_id,
      action,
      signal,

      process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
        ? stagingEndpoint
        : undefined,
    );

    console.log('verifyResponse', verifyResponse);
  } catch (error) {
    console.log('Error in verifyCloudProof', error);
  }

  return verifyResponse;
};
