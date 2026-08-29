import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const [users, props, leads, deals, comms] = await Promise.all([
    db.user.count(),
    db.property.count(),
    db.lead.count(),
    db.deal.count(),
    db.commission.count(),
  ]);
  const roleCounts = await db.user.groupBy({
    by: ["role"],
    _count: { _all: true },
  });
  console.log(
    "users=" +
      users +
      " properties=" +
      props +
      " leads=" +
      leads +
      " deals=" +
      deals +
      " commissions=" +
      comms
  );
  console.log(JSON.stringify(roleCounts));
}

main().finally(() => db.$disconnect());