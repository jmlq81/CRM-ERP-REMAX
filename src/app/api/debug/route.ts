import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function GET() {
  const errors: string[] = [];

  // Check AUTH_SECRET
  if (!process.env.AUTH_SECRET) errors.push("AUTH_SECRET no está configurado");
  if (!process.env.AUTH_GOOGLE_ID) errors.push("AUTH_GOOGLE_ID no está configurado");
  if (!process.env.AUTH_GOOGLE_SECRET) errors.push("AUTH_GOOGLE_SECRET no está configurado");
  if (!process.env.DATABASE_URL) errors.push("DATABASE_URL no está configurado");

  // Check DB connection
  try {
    await db.$connect();
    const userCount = await db.user.count();
    await db.$disconnect();
  } catch (e) {
    errors.push(`Error conectando a BD: ${e instanceof Error ? e.message : "unknown"}`);
  }

  // Check session
  try {
    const session = await auth();
    return Response.json({
      status: errors.length === 0 ? "ok" : "issues",
      errors,
      hasSession: !!session,
      env: {
        hasSecret: !!process.env.AUTH_SECRET,
        hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
        hasGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      },
    });
  } catch (e) {
    errors.push(`Error en auth(): ${e instanceof Error ? e.message : "unknown"}`);
    return Response.json({ status: "error", errors });
  }
}
