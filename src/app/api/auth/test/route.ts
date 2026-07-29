import { db } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  results.nodeVersion = process.version;
  results.platform = process.platform;

  try {
    const { PrismaClient } = await import("@/generated/prisma/client");
    results.importedPrismaClient = true;
  } catch (e) {
    errors.push(`Import error: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    await db.$connect();
    const tables = await db.$queryRawUnsafe<Array<{ tablename: string }>>(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"
    );
    results.tables = tables.map((t) => t.tablename);
    await db.$disconnect();
  } catch (e) {
    errors.push(`DB query error: ${e instanceof Error ? e.stack : String(e)}`);
  }

  return Response.json({ status: errors.length === 0 ? "ok" : "error", errors, results });
}
