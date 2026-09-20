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
  rpId: string,
  environment: 'production' | 'staging' | 'sandbox',
): Promise<VerifyResponse | null> => {
  if (!/^rp_[a-zA-Z0-9_]+$/.test(rpId)) {
    throw new Error('Invalid RP ID format');
  }

  const baseUrl =
    environment === 'production'
      ? 'https://developer.worldcoin.org'
      : process.env.NEXT_SERVER_DEV_PORTAL_URL;

  if (!baseUrl) {
    throw new Error('NEXT_SERVER_DEV_PORTAL_URL is not configured');
  }

  try {
    const response = await fetch(
      `${baseUrl}/api/v4/verify/${encodeURIComponent(rpId)}`,
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
