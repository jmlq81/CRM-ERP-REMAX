import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/prisma";

export const runtime = "nodejs";

const SESSION_COOKIES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

const EXTRA_COOKIES = [
  "__Host-authjs.csrf-token",
  "authjs.csrf-token",
  "__Secure-authjs.callback-url",
  "authjs.callback-url",
];

export async function POST() {
  const jar = await cookies();
  for (const name of SESSION_COOKIES) {
    const value = jar.get(name)?.value;
    if (!value) continue;
    try {
      await db.session.deleteMany({ where: { sessionToken: value } });
    } catch {
      void 0;
    }
  }

  const res = NextResponse.json({ ok: true });
  for (const name of [...SESSION_COOKIES, ...EXTRA_COOKIES]) {
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: name.startsWith("__"),
    });
  }
  return res;
}