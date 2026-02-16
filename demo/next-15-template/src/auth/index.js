import { hashNonce } from '@/auth/wallet/client-helpers';
import { MiniKit, verifySiweMessage } from '@worldcoin/minikit-js';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
// Auth configuration for Wallet Auth based sessions
// For more information on each option (and a full list of options) go to
// https://authjs.dev/getting-started/authentication/credentials
export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'World App Wallet',
      credentials: {
        nonce: { label: 'Nonce', type: 'text' },
        signedNonce: { label: 'Signed Nonce', type: 'text' },
        finalPayloadJson: { label: 'Final Payload', type: 'text' },
      },
      // @ts-expect-error TODO
      authorize: async ({ nonce, signedNonce, finalPayloadJson }) => {
        const expectedSignedNonce = hashNonce({ nonce });
        if (signedNonce !== expectedSignedNonce) {
          console.log('Invalid signed nonce');
          return null;
        }
        const finalPayload = JSON.parse(finalPayloadJson);
        const result = await verifySiweMessage(finalPayload, nonce);
        if (!result.isValid || !result.siweMessageData.address) {
          console.log('Invalid final payload');
          return null;
        }
        // Optionally, fetch the user info from your own database
        const userInfo = await MiniKit.getUserInfo(finalPayload.address);
        return {
          id: finalPayload.address,
          ...userInfo,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.walletAddress = user.walletAddress;
        token.username = user.username;
        token.profilePictureUrl = user.profilePictureUrl;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId;
        session.user.walletAddress = token.address;
        session.user.username = token.username;
        session.user.profilePictureUrl = token.profilePictureUrl;
      }
      return session;
    },
  },
});
