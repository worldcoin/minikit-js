import { NextAuthOptions, User } from 'next-auth';
import { encode } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user?: User & {
      verificationLevel?: string;
    };
    accessToken?: string;
    provider?: string;
  }
}

// Extend the built-in JWT types
declare module 'next-auth/jwt' {
  interface JWT {
    user?: User & {
      verificationLevel?: string;
    };
    accessToken?: string;
    provider?: string;
  }
}

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
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
    }),
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
    async session({ session, token }) {
      if (token) {
        session.user = token.user;
        session.accessToken = token.accessToken;
        session.provider = token.provider;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If we're coming from Google OAuth callback
      if (url.includes('/api/auth/callback/google')) {
        // Get the current session token from the cookie
        const sessionToken = await encode({
          secret: process.env.NEXTAUTH_SECRET!,
          token: {
            userRole: 'admin',
            // Include any other session data you need
          },
        });

        // Construct the deep link back to the webview
        const redirectUri = encodeURIComponent(
          `${process.env.NEXTAUTH_URL}/api/auth-redirect`,
        );
        return `worldapp://mini-app?app_id=${process.env.WLD_CLIENT_ID}&path=/api/auth-redirect?token=${sessionToken}&redirect_uri=${redirectUri}`;
      }

      // For other redirects, use the default behavior
      return url;
    },
  },
  debug: true,
};
