'use server';

import { IDKitResult } from '@worldcoin/idkit';

export interface VerifyResponse {
  success: boolean;
  code?: string;
  detail?: string;
  attribute?: string | null;
}

/**
 * Verify a proof using the Developer Portal v4 API
 */
export const verifyProof = async (
  params: IDKitResult,
  app_id: string,
): Promise<VerifyResponse | null> => {
  if (!/^app_[a-zA-Z0-9_]+$/.test(app_id)) {
    throw new Error('Invalid app_id format');
  }

  const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';
  const baseUrl = isStaging
    ? process.env.NEXT_SERVER_DEV_PORTAL_URL
    : 'https://developer.worldcoin.org';

  try {
    const response = await fetch(
      `${baseUrl}/api/v4/verify/${encodeURIComponent(app_id)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      },
    );

    const result = await response.json();
    console.log('verifyResponse', result);
    return result;
  } catch (error) {
    console.error('Error in verifyProof', error);
    return null;
  }
};
