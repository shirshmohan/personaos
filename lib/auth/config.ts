import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the Auth.js config. Deliberately free of the Drizzle
 * adapter and any Node-only imports so `middleware.ts` can use it.
 */
export const authConfig = {
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/studio/sign-in" },
  callbacks: {
    /**
     * D10: single-owner allowlist. Everyone can read the public site;
     * only OWNER_EMAIL may ever hold a session.
     */
    signIn({ profile }) {
      const owner = process.env.OWNER_EMAIL?.toLowerCase();
      const email = profile?.email?.toLowerCase();
      return Boolean(owner && email && email === owner && profile?.email_verified);
    },
    authorized({ auth, request }) {
      const isStudio = request.nextUrl.pathname.startsWith("/studio");
      const isSignIn = request.nextUrl.pathname === "/studio/sign-in";
      if (isSignIn) return true;
      if (isStudio) return Boolean(auth?.user);
      return true;
    },
  },
} satisfies NextAuthConfig;
