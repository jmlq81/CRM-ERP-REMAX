import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET() {
  const errors: string[] = [];
  const info: Record<string, unknown> = {};

  try {
    await db.$connect();
    const userCount = await db.user.count();
    info.dbConnected = true;
    info.userCount = userCount;
  } catch (e) {
    errors.push(`DB: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const session = await auth();
    info.sessionExists = !!session;
  } catch (e) {
    errors.push(`Auth: ${e instanceof Error ? e.message : String(e)}`);
  }

  return Response.json({
    status: errors.length === 0 ? "ok" : "error",
    errors,
    info,
    env: {
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
      AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}
