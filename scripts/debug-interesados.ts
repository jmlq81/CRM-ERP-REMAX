import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const arg = process.argv[2];
  let user = arg ? await db.user.findUnique({ where: { id: arg } }) : null;
  if (!user && arg && arg.includes("@")) {
    user = await db.user.findUnique({ where: { email: arg } });
  }
  const auth = user
    ? { id: user.id, role: user.role, companyId: user.companyId, activeCompanyId: user.activeCompanyId, email: user.email }
    : null;
  console.log("auth:", JSON.stringify(auth));
  if (!auth) { console.log("no auth user"); return; }
  const empresaId = auth.role === "ADMIN" && auth.activeCompanyId ? auth.activeCompanyId : auth.companyId!;
  const canSeeAll = auth.role === "ADMIN" || auth.role === "OWNER";
  const where: Record<string, unknown> = { companyId: empresaId };
  if (!canSeeAll) where.userId = auth.id;
  const [interesados, total] = await Promise.all([
    db.interesado.findMany({ where, include: { property: true, interactions: true }, orderBy: { createdAt: "desc" }, take: 20, skip: 0 }),
    db.interesado.count({ where }),
  ]);
  console.log("total:", total, "rows:", interesados.length);
  console.log(JSON.stringify(interesados.map((i) => ({ id: i.id, name: i.name, status: i.status, u: i.userId, c: i.companyId }))));
}

main().finally(() => db.$disconnect());