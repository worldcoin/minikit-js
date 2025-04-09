import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  // https://next-auth.js.org/configuration/providers/oauth
  providers: [
    {
      id: 'worldcoin',
      name: 'Worldcoin',
      type: 'oauth',
      wellKnown:
        process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
          ? 'https://staging.id.worldcoin.org/.well-known/openid-configuration'
          : 'https://id.worldcoin.org/.well-known/openid-configuration',
      authorization: { params: { scope: 'openid' } },
      clientId: process.env.WLD_CLIENT_ID,
      clientSecret: process.env.WLD_CLIENT_SECRET,
      idToken: true,
      checks: ['state', 'nonce', 'pkce'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.sub,
          verificationLevel:
            profile['https://id.worldcoin.org/v1'].verification_level,
        };
      },
    },
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          redirect_uri:
            'https://worldcoin.org/mini-apps?app_id=app_staging_5748c49d2e6c68849479e0b321bc5257&path=%2Fapi%2Fauth%2Fcallback%2Fgoogle',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      token.userRole = 'admin';
      return token;
    },
  },
  debug: true,
};
