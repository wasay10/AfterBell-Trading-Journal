import type { NextAuthConfig, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Edge-safe auth config — no database imports
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" as const },
  callbacks: {
    authorized({
      auth,
      request: { nextUrl },
    }: {
      auth: Session | null;
      request: { nextUrl: URL };
    }) {
      const isLoggedIn = !!auth?.user;
      const publicPaths = ["/login", "/register", "/api/auth"];
      const isPublic = publicPaths.some((p) => nextUrl.pathname.startsWith(p));
      if (isPublic) return true;
      if (isLoggedIn) return true;
      return false;
    },
    jwt({ token, user }: { token: JWT; user?: { id?: string } }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      if (token.id) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
