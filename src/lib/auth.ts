import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./prisma";
import { verifyPassword } from "./password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user?.passwordHash) return null;
        if (!verifyPassword(credentials.password as string, user.passwordHash)) {
          return null;
        }
        const safeUser = { ...user };
        delete (safeUser as { passwordHash?: string }).passwordHash;
        return safeUser;
      },
    }),
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = (user?.id ?? token.sub) as string;
        const dbUser = await db.user.findUnique({
          where: { id: session.user.id },
          select: { role: true },
        });
        session.user.role = dbUser?.role ?? "AGENT";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        Object.assign(token, {
          id: user.id,
          role: dbUser?.role ?? "AGENT",
        });
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  logger: {
    error(code, ...message) {
      console.error("AUTH_ERROR:", code, ...message);
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "ADMIN" | "AGENT";
    };
  }
}
