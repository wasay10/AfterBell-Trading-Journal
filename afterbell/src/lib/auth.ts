import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "@/auth.config";
import { DEFAULT_MISTAKES, DEFAULT_SESSIONS } from "./utils";

async function getOrCreateGoogleUser(email: string, name: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, displayName: name ?? email.split("@")[0] },
    });
    await prisma.mistake.createMany({
      data: DEFAULT_MISTAKES.map((n) => ({ userId: user!.id, name: n, isCustom: false })),
    });
    await prisma.tradingSession.createMany({
      data: DEFAULT_SESSIONS.map((s) => ({ userId: user!.id, ...s })),
    });
  }
  return user;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.displayName || user.email };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const dbUser = await getOrCreateGoogleUser(
          user.email,
          user.name ?? user.email
        );
        // Store DB id on the user object so jwt callback can pick it up
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) token.id = user.id;
      // For Google sign-in, resolve the real DB user id from email on subsequent requests
      if (!token.id && token.email && account?.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true },
        });
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },
  },
});
