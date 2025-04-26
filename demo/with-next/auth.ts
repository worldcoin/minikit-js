import NextAuth, { NextAuthConfig, NextAuthResult } from 'next-auth';

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthConfig = {
  session: {
    strategy: 'jwt',
  },
  // https://next-auth.js.org/configuration/providers/oauth
  providers: [
    {
      id: 'worldcoin',
      name: 'Worldcoin',
      type: 'oidc',
      authorization: { params: { scope: 'openid' } },
      clientId: process.env.WLD_CLIENT_ID,
      clientSecret: process.env.WLD_CLIENT_SECRET,
      issuer:
        process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
          ? 'https://staging.id.worldcoin.org'
          : 'https://id.worldcoin.org',
      checks: ['state', 'pkce', 'nonce'],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.sub,
          verificationLevel:
            profile['https://id.worldcoin.org/v1'].verification_level,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.provider = account.provider;
      }
      if (user) {
        token.user = user;
      }
      return token;
    },
  },
  debug: true,
};

const nextAuth = NextAuth(authOptions);

export const signIn: NextAuthResult['signIn'] = nextAuth.signIn;
export const auth: NextAuthResult['auth'] = nextAuth.auth;
export const handlers: NextAuthResult['handlers'] = nextAuth.handlers;
