import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    GitHub({
      clientId: process.env.NEXTAUTH_GITHUB_ID!,
      clientSecret: process.env.NEXTAUTH_GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "repo user:email",
        },
      },
    }),
    Google({
      clientId: process.env.NEXTAUTH_GOOGLE_ID!,
      clientSecret: process.env.NEXTAUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-in",
  },
} satisfies NextAuthConfig;
