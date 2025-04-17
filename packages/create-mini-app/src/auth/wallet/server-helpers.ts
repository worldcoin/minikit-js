'use server';
import crypto from 'crypto';
import { hashNonce } from './client-helpers';
/**
 * Generates a new random nonce and its corresponding HMAC signature.
 * @async
 * @returns {Promise<{ nonce: string, signedNonce: string }>} An object containing the nonce and its signed (hashed) value.
 */
export const getNewNonces = async () => {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const signedNonce = hashNonce({ nonce });
  return {
    nonce,
    signedNonce,
  };
};
