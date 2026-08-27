import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const targetEmail = process.env.ADMIN_EMAIL;
  if (targetEmail) {
    const user = await db.user.upsert({
      where: { email: targetEmail },
      update: { role: "ADMIN" },
      create: {
        email: targetEmail,
        role: "ADMIN",
        name: process.env.ADMIN_NAME || targetEmail,
      },
    });
    console.log(`Promovido a ADMIN: ${user.email} (${user.id})`);
  } else {
    const first = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!first) {
      console.log("No hay usuarios aún. Inicia sesión con Google primero.");
      return;
    }
    await db.user.update({ where: { id: first.id }, data: { role: "ADMIN" } });
    console.log(`Primer usuario promovido a ADMIN: ${first.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());