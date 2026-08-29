import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const CID = "cmp_oficina_principal";

async function main() {
  await db.$executeRawUnsafe(
    `INSERT INTO companies (id, name, active, "createdAt", "updatedAt") VALUES ($1, 'Oficina Principal', true, now(), now()) ON CONFLICT (id) DO NOTHING`,
    CID
  );

  await db.$executeRawUnsafe(`UPDATE users SET "companyId" = $1, "activeCompanyId" = $1 WHERE "companyId" IS NULL`, CID);
  await db.$executeRawUnsafe(`UPDATE properties SET "companyId" = $1 WHERE "companyId" IS NULL`, CID);
  await db.$executeRawUnsafe(`UPDATE interesados SET "companyId" = $1 WHERE "companyId" IS NULL`, CID);
  await db.$executeRawUnsafe(`UPDATE tasks SET "companyId" = $1 WHERE "companyId" IS NULL`, CID);
  await db.$executeRawUnsafe(`UPDATE publications SET "companyId" = $1 WHERE "companyId" IS NULL`, CID);
  await db.$executeRawUnsafe(`UPDATE deals SET "companyId" = $1 WHERE "companyId" IS NULL`, CID);
  await db.$executeRawUnsafe(`UPDATE commissions SET "companyId" = $1 WHERE "companyId" IS NULL`, CID);

  const nullUsers = await db.$queryRawUnsafe<{ c: number }[]>(`SELECT count(*)::int AS c FROM users WHERE "companyId" IS NULL`);
  const nullProps = await db.$queryRawUnsafe<{ c: number }[]>(`SELECT count(*)::int AS c FROM properties WHERE "companyId" IS NULL`);
  const nullLeads = await db.$queryRawUnsafe<{ c: number }[]>(`SELECT count(*)::int AS c FROM interesados WHERE "companyId" IS NULL`);
  const nullDeals = await db.$queryRawUnsafe<{ c: number }[]>(`SELECT count(*)::int AS c FROM deals WHERE "companyId" IS NULL`);
  const users = await db.$queryRawUnsafe<{ c: number }[]>(`SELECT count(*)::int AS c FROM users`);
  const leads = await db.$queryRawUnsafe<{ c: number }[]>(`SELECT count(*)::int AS c FROM interesados`);
  console.log(
    `NULL restantes -> users:${nullUsers[0].c} properties:${nullProps[0].c} interesados:${nullLeads[0].c} deals:${nullDeals[0].c}`
  );
  console.log(`fueron: users=${users[0].c} interesados=${leads[0].c} deals=${nullDeals[0].c}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());