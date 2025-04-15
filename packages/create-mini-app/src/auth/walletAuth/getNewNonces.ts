'use server'

import crypto from 'crypto'
import { getSignedNonce } from './getSignedNonce'

export const getNewNonces = async () => {
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const signedNonce = getSignedNonce({ nonce })

  return {
    nonce,
    signedNonce,
  }
}
