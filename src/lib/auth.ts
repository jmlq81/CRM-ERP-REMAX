import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./prisma";

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
        return user;
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
        (token as any).id = user.id;
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        (token as any).role = dbUser?.role ?? "AGENT";
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
