import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const count = async (sql: string) => {
    const rows = await db.$queryRawUnsafe<{ c: number }[]>(sql);
    return rows[0].c;
  };

  const before = {
    users: await count(`SELECT count(*)::int AS c FROM "users"`),
    properties: await count(`SELECT count(*)::int AS c FROM "properties"`),
    leads: await count(`SELECT count(*)::int AS c FROM "leads"`),
    deals: await count(`SELECT count(*)::int AS c FROM "deals"`),
    commissions: await count(`SELECT count(*)::int AS c FROM "commissions"`),
  };
  console.log("ANTES:", JSON.stringify(before));

  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`ALTER TABLE "leads" RENAME TO "interesados"`);
    await tx.$executeRawUnsafe(`ALTER TYPE "LeadStatus" RENAME TO "InteresadoStatus"`);
    await tx.$executeRawUnsafe(`ALTER TYPE "LeadSource" RENAME TO "InteresadoSource"`);
  });

  const after = {
    users: await count(`SELECT count(*)::int AS c FROM "users"`),
    properties: await count(`SELECT count(*)::int AS c FROM "properties"`),
    leads: await count(`SELECT count(*)::int AS c FROM "interesados"`),
    deals: await count(`SELECT count(*)::int AS c FROM "deals"`),
    commissions: await count(`SELECT count(*)::int AS c FROM "commissions"`),
  };
  console.log("DESPUES:", JSON.stringify(after));
  console.log("OK: datos intactos =", JSON.stringify(before) === JSON.stringify(after));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());