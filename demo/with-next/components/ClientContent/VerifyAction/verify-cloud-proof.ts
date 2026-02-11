'use server';

import type { VerifyResult } from '@worldcoin/minikit-js';

export interface VerifyResponse {
  success: boolean;
  code?: string;
  detail?: string;
  attribute?: string | null;
}

/**
 * Verify a proof using the Developer Portal API
 *
 * For v3 proofs (current), use /api/v2/verify endpoint
 * For v4 proofs (upcoming), use /api/v4/verify endpoint
 */
export const verifyProof = async (params: {
  app_id: `app_${string}`;
  action: string;
  signal?: string;
  payload: VerifyResult;
}): Promise<VerifyResponse | null> => {
  const { app_id, action, payload, signal } = params;

  const isStaging = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';
  const baseUrl = isStaging
    ? process.env.NEXT_SERVER_DEV_PORTAL_URL
    : 'https://developer.worldcoin.org';

  try {
    // V3 proof verification (current format)
    const response = await fetch(
      `${baseUrl}/api/v2/verify/${app_id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: payload.proof,
          merkle_root: payload.merkle_root,
          nullifier_hash: payload.nullifier_hash,
          verification_level: payload.verification_level,
          action,
          signal,
        }),
      }
    );

    const result = await response.json();
    console.log('verifyResponse', result);
    return result;
  } catch (error) {
    console.error('Error in verifyProof', error);
    return null;
  }
};
