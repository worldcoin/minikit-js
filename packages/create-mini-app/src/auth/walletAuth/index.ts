import { MiniKit } from '@worldcoin/minikit-js'
import { signIn } from 'next-auth/react'
import { getNewNonces } from './getNewNonces'

export const walletAuth = async () => {
  const { nonce, signedNonce } = await getNewNonces()

  const result = await MiniKit.commandsAsync.walletAuth({
    nonce,
    expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
    statement: `Authenticate (${crypto.randomUUID().replace(/-/g, '')}).`,
  })

  if (!result) {
    throw new Error('Wallet authentication failed')
  }

  if (result.finalPayload.status !== 'success') {
    throw new Error('Wallet authentication failed')
  }

  return signIn('credentials', {
    redirect: false,
    nonce,
    signedNonce,
    finalPayloadJson: JSON.stringify(result.finalPayload),
  })
}
