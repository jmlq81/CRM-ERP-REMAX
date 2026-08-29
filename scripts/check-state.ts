import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const [users, props, interesados, deals, comms, companies] = await Promise.all([
    db.user.count(),
    db.property.count(),
    db.interesado.count(),
    db.deal.count(),
    db.commission.count(),
    db.company.count(),
  ]);
  const roleCounts = await db.user.groupBy({
    by: ["role"],
    _count: { _all: true },
  });
  const empresas = await db.company.findMany({
    select: {
      id: true,
      name: true,
      ruc: true,
      maxAgents: true,
      maxProperties: true,
      _count: { select: { users: true, properties: true, interesados: true } },
    },
  });
  console.log(
    "users=" +
      users +
      " properties=" +
      props +
      " interesados=" +
      interesados +
      " deals=" +
      deals +
      " commissions=" +
      comms +
      " companies=" +
      companies
  );
  console.log(JSON.stringify(roleCounts));
  console.log(JSON.stringify(empresas));
}

main().finally(() => db.$disconnect());