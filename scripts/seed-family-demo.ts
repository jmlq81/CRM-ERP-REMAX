import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const DEMO_PASSWORD = "Demo1234";

const COMPANY_NAME = "RE/MAX Family Demo";

type DemoRole = "ADMIN" | "AGENT" | "TASADOR";

const DEMO_USERS: Array<{
  email: string;
  name: string;
  role: DemoRole;
}> = [
  { email: "admin@remax-family.pe", name: "Administrador Demo", role: "ADMIN" },
  { email: "agente@remax-family.pe", name: "Agente Demo", role: "AGENT" },
  { email: "tasador@remax-family.pe", name: "Tasador Demo", role: "TASADOR" },
];

const PROPERTIES = [
  {
    title: "Departamento en Miraflores",
    description:
      "Departamento de 95 m2 a pocas cuadras del Malecon, con ascensor, parqueo y vista amplia. Cocina americana, cuarto de servicio y dos balcones.",
    price: "450000",
    address: "Av. Ejemplo 1234, Dpto 801",
    district: "Miraflores",
    city: "Lima",
    bedrooms: 3,
    bathrooms: 2,
    area: 95,
    type: "APARTMENT" as const,
    features: ["Ascensor", "Parqueo", "Vista", "Balcon"],
  },
  {
    title: "Apartamento en San Isidro",
    description:
      "Apartamento de 78 m2 en calle tranquila, cerca de servicios y transporte público. Dos dormitorios, sala comedor y cocina equipada.",
    price: "385000",
    address: "Calle Ejemplo 456",
    district: "San Isidro",
    city: "Lima",
    bedrooms: 2,
    bathrooms: 2,
    area: 78,
    type: "APARTMENT" as const,
    features: ["Cocina equipada", "Parqueo"],
  },
  {
    title: "Casa en Santiago de Surco",
    description:
      "Casa de 220 m2 en zona residencial, con jardin, patio y terraza. Cuatro dormitorios, tres banos y estacionamiento para dos autos.",
    price: "880000",
    address: "Av. Ejemplo 789",
    district: "Santiago de Surco",
    city: "Lima",
    bedrooms: 4,
    bathrooms: 3,
    area: 220,
    type: "HOUSE" as const,
    features: ["Jardin", "Patio", "Terraza", "Parqueo 2 autos"],
  },
  {
    title: "Oficina en San Borja",
    description:
      "Oficina de 140 m2 en edificio de oficinas, con sala de reuniones, dos oficinas abiertas y recepcion. Ideal para equipo mediano.",
    price: "520000",
    address: "Av. Ejemplo 321, Piso 5",
    district: "San Borja",
    city: "Lima",
    bedrooms: 0,
    bathrooms: 2,
    area: 140,
    type: "OFFICE" as const,
    features: ["Sala de reuniones", "Recepcion", "Ascensor"],
  },
];

const LEADS = [
  {
    name: "Interesado Demo Uno",
    email: "interesado1@demo.local",
    phone: "+51 900 000 001",
    source: "WEB" as const,
    status: "QUALIFIED" as const,
    budget: "460000",
    notes: "Perfil generico de demostracion. Busca departamento en Miraflores.",
    searchType: "APARTMENT" as const,
    searchDistricts: ["Miraflores"],
    searchMinPrice: "350000",
    searchMaxPrice: "480000",
    searchMinArea: 70,
    searchMaxArea: 110,
    daysAgo: 2,
  },
  {
    name: "Interesado Demo Dos",
    email: "interesado2@demo.local",
    phone: "+51 900 000 002",
    source: "FACEBOOK" as const,
    status: "NEW" as const,
    budget: "900000",
    notes: "Perfil generico de demostracion. Busca casa en Surco.",
    searchType: "HOUSE" as const,
    searchDistricts: ["Santiago de Surco"],
    searchMinPrice: "700000",
    searchMaxPrice: "1000000",
    searchMinArea: 150,
    searchMaxArea: 300,
    daysAgo: 45,
  },
  {
    name: "Interesado Demo Tres",
    email: "interesado3@demo.local",
    phone: "+51 900 000 003",
    source: "REFERRAL" as const,
    status: "CONTACTED" as const,
    budget: "600000",
    notes: "Perfil generico de demostracion. Busca oficina en San Borja.",
    searchType: "OFFICE" as const,
    searchDistricts: ["San Borja"],
    searchMinPrice: "400000",
    searchMaxPrice: "650000",
    searchMinArea: 100,
    searchMaxArea: 200,
    daysAgo: 5,
  },
];

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}

async function main() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!admin) throw new Error("No hay un usuario ADMIN. Crea tu cuenta e inicia sesion primero.");
  if (!admin.companyId) throw new Error("El usuario ADMIN no tiene empresa asignada");

  const companyId = admin.companyId;

  let created = 0;
  let skipped = 0;

  const userIds: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const existing = await db.user.findFirst({
      where: { companyId, email: u.email },
    });
    if (existing) {
      userIds[u.role] = existing.id;
      skipped++;
      continue;
    }
    const createdUser = await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        companyId,
        passwordHash: hashPassword(DEMO_PASSWORD),
      },
    });
    userIds[u.role] = createdUser.id;
    created++;
  }

  const agentId = userIds.AGENT ?? admin.id;
  const tasadorId = userIds.TASADOR ?? admin.id;

  const propertyIds: string[] = [];
  for (const p of PROPERTIES) {
    const exists = await db.property.findFirst({
      where: { companyId, title: p.title, address: p.address },
    });
    if (exists) {
      propertyIds.push(exists.id);
      skipped++;
      continue;
    }
    const createdProp = await db.property.create({
      data: {
        ...p,
        state: "Lima",
        country: "Peru",
        currency: "PEN",
        status: "ACTIVE",
        contactName: "RE/MAX Family Demo",
        contactPhone: "+51 900 000 000",
        userId: agentId,
        companyId,
      },
    });
    propertyIds.push(createdProp.id);
    created++;
  }

  for (const lead of LEADS) {
    const exists = await db.interesado.findFirst({
      where: { companyId, email: lead.email },
    });
    if (exists) {
      skipped++;
      continue;
    }
    const createdLead = await db.interesado.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        notes: lead.notes,
        budget: lead.budget,
        currency: "PEN",
        interestLevel: 3,
        searchType: lead.searchType,
        searchDistricts: lead.searchDistricts,
        searchMinPrice: lead.searchMinPrice,
        searchMaxPrice: lead.searchMaxPrice,
        searchMinArea: lead.searchMinArea,
        searchMaxArea: lead.searchMaxArea,
        lastActivityAt: daysAgo(lead.daysAgo),
        userId: agentId,
        companyId,
      },
    });

    await db.interaction.create({
      data: {
        interesadoId: createdLead.id,
        userId: agentId,
        type: "NOTE",
        content: "Registro de demostracion, sin datos reales.",
      },
    });
    created++;
  }

  const demoProperty = await db.property.findFirst({
    where: { id: { in: propertyIds } },
  });
  if (demoProperty) {
    const hasValuation = await db.valuation.findFirst({
      where: { propertyId: demoProperty.id, userId: tasadorId },
    });
    if (!hasValuation) {
      await db.valuation.create({
        data: {
          propertyId: demoProperty.id,
          userId: tasadorId,
          companyId,
          marketValue: "455000",
          source: "MARKET",
          notes: "Tasacion de demostracion basada en comparables.",
        },
      });
      created++;
    }
  }

  console.log("Demo listo.");
  console.log(`  creados: ${created}, omitidos: ${skipped}`);
  console.log("  empresa:", COMPANY_NAME);
  console.log(
    `  cuentas: ${DEMO_USERS.map((u) => u.email).join(", ")}`
  );
  console.log(`  password para configurar: ${DEMO_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });