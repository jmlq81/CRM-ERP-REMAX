import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const admin = await db.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!admin) throw new Error("No hay un usuario ADMIN. Crea tu cuenta e inicia sesión primero.");
  const partner = await db.user.findFirst({
    where: { role: "AGENT", id: { not: admin.id } },
    orderBy: { createdAt: "asc" },
  });

  const ownerId = admin.id;
  if (!admin.companyId) throw new Error("El usuario ADMIN no tiene empresa asignada");
  const companyId = admin.companyId;

  const p1 = await db.property.create({
    data: {
      title: "Departamento en Miraflores",
      description:
        "Hermoso departamento de 95 m² en pleno Miraflores, a 2 cuadras del Malecón. Edificio con ascensor, parqueo y excelente vista. Cocina americana con muebles altos y bajos, cuarto de servicio, 2 balcones amplios. Zona comercial y tranquila a la vez, ideal para vivir o invertir.",
      price: "450000",
      currency: "PEN",
      address: "Av. Larco 1234, Dpto 801",
      city: "Lima",
      district: "Miraflores",
      state: "Lima",
      country: "Peru",
      bedrooms: 3,
      bathrooms: 2,
      area: 95,
      type: "APARTMENT",
      status: "ACTIVE",
      features: ["Ascensor", "Cocina americana", "2 balcones", "Parqueo", "Vista al mar"],
      yearBuilt: 2018,
      parking: 1,
      floors: 8,
      contactName: admin.name || "Equipo RE/MAX",
      contactPhone: "+51 999 000 111",
      featuredText1: "¡Departamento con vista al mar!",
      featuredText2: "2 cuadras del Malecón de Miraflores",
      userId: ownerId,
      companyId,
    },
  });

  const p2 = await db.property.create({
    data: {
      title: "Casa en Surco",
      description:
        "Casa de 220 m² en zona residencial de Surco, con jardín amplio, 3 niveles y estacionamiento para 2 autos. Ambiente familiar, cerca de colegios y centros comerciales. Sala doble, comedor, cocina amplia, 4 dormitorios con closets, patio y terraza. Trato directo.",
      price: "880000",
      currency: "PEN",
      address: "Calle Los Ayllus 456",
      city: "Lima",
      district: "Santiago de Surco",
      state: "Lima",
      country: "Peru",
      bedrooms: 4,
      bathrooms: 3,
      area: 220,
      type: "HOUSE",
      status: "SOLD",
      features: ["Jardín", "Patio", "Terraza", "Parqueo 2 autos"],
      yearBuilt: 2012,
      parking: 2,
      floors: 3,
      contactName: admin.name || "Equipo RE/MAX",
      contactPhone: "+51 999 000 222",
      featuredText1: "Casa familiar con jardín en Surco",
      featuredText2: "Lista para entrega inmediata",
      userId: ownerId,
      companyId,
    },
  });

  const lead1 = await db.interesado.create({
    data: {
      name: "María Fernanda Torres",
      email: "mfernanda.torres@gmail.com",
      phone: "+51 987 654 321",
      source: "FACEBOOK",
      status: "QUALIFIED",
      notes: "Contactada por Facebook Marketplace. Busca departamento de 3 dormitorios en Miraflores. Muy interesada, agenda visita.",
      budget: "450000",
      currency: "PEN",
      interestLevel: 8,
      nextFollowUpAt: new Date(Date.now() + 2 * 86400000),
      userId: ownerId,
      companyId,
      propertyId: p1.id,
    },
  });

  const lead2 = await db.interesado.create({
    data: {
      name: "Carlos Mendoza",
      email: "cmendoza@outlook.com",
      phone: "+51 912 345 678",
      source: "WEB",
      status: "NEW",
      notes: "Llenó el formulario del sitio. Interesado en casas en Surco, presupuesto flexible.",
      budget: "900000",
      currency: "PEN",
      interestLevel: 6,
      nextFollowUpAt: new Date(Date.now() + 1 * 86400000),
      userId: ownerId,
      companyId,
    },
  });

  await db.task.create({
    data: {
      title: "Llamar a María Fernanda para coordinar visita",
      description: "Confirmar horario de visita al departamento de Miraflores.",
      dueDate: new Date(Date.now() + 1 * 86400000),
      priority: "HIGH",
      userId: ownerId,
      companyId,
      interesadoId: lead1.id,
      propertyId: p1.id,
    },
  });

  await db.interaction.create({
    data: {
      type: "NOTE",
      content: "Primer contacto por Messenger. Le envié fotos y el video. Quiere verlo en persona esta semana.",
      interesadoId: lead1.id,
      userId: ownerId,
    },
  });

  const deal1 = await db.deal.create({
    data: {
      title: "Venta Dpto Miraflores",
      propertyId: p1.id,
      interesadoId: lead1.id,
      status: "NEGOTIATION",
      commissionPct: 3,
      notes: partner
        ? "Operación compartida: agente principal (60%) + co-broker (40%)."
        : "Operación en negociación. Cliente evaluando financiamiento.",
      createdById: ownerId,
      companyId,
      participants: {
        create: [
          { userId: ownerId, role: "PRIMARY", sharePct: 60 },
          ...(partner
            ? [{ userId: partner.id, role: "CO_BROKER" as const, sharePct: 40 }]
            : []),
        ],
      },
    },
  });

  const salePrice = 850000;
  const commissionPct = 3;
  const totalCommission = Math.round((salePrice * commissionPct) / 100);
  const shares = [
    { userId: ownerId, sharePct: 60, amount: (totalCommission * 60) / 100 },
    ...(partner ? [{ userId: partner.id, sharePct: 40, amount: (totalCommission * 40) / 100 }] : []),
  ];

  const deal2 = await db.deal.create({
    data: {
      title: "Venta Casa Surco",
      propertyId: p2.id,
      status: "CLOSED_WON",
      salePrice: String(salePrice),
      commissionPct,
      totalCommission: String(totalCommission),
      notes: partner ? "Cierre con co-broker. Propiedad entregada al comprador." : "Cierre exitoso. Propiedad entregada.",
      createdById: ownerId,
      companyId,
      participants: {
        create: shares.map((s) => ({
          userId: s.userId,
          role: s.userId === ownerId ? "PRIMARY" : "CO_BROKER",
          sharePct: s.sharePct,
        })),
      },
      commissions: {
        create: shares.map((s) => ({
          userId: s.userId,
          companyId,
          amount: String(Math.round(s.amount)),
          currency: "PEN",
          status: "PENDING",
          notes: `Comisión operación Casa Surco`,
        })),
      },
    },
  });

  console.log("=== DATOS DE EJEMPLO CREADOS ===");
  console.log("Propiedades:", p1.title, "|", p2.title);
  console.log("Interesados:", lead1.name, "|", lead2.name);
  console.log("Operación en negociación:", deal1.title);
  console.log(
    "Operación cerrada (GANADA):",
    deal2.title,
    "- comisión total S/",
    totalCommission,
    partner ? "(60%/40% repartida entre ambos agentes)" : ""
  );
  if (partner) {
    console.log("Co-broker participante:", partner.name || partner.email);
  }
  console.log("1 tarea pendiente + 1 interacción creadas.");
  console.log("Tip: el dashboard ya mostrará propiedades, interesados, comisiones pendientes y tareas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());