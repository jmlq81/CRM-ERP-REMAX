import { router, protectedProcedure, getAuth } from "../trpc";
import type { Context, AuthInfo } from "../trpc";
import { z } from "zod";

const participantSchema = z.object({
  userId: z.string(),
  role: z.enum(["PRIMARY", "CO_BROKER", "REFERRAL"]).default("PRIMARY"),
  sharePct: z.number().optional(),
});

type ProcedureCtx = {
  session: { user: { id: string } };
  db: Context["db"];
};

type DealForCheck = {
  id: string;
  companyId: string;
  createdById: string;
  participants: { userId: string }[];
};

async function canEditDeal(ctx: ProcedureCtx, auth: AuthInfo, deal: DealForCheck) {
  if (deal.companyId !== auth.empresaId) return false;
  if (auth.canSeeAll) return true;
  return (
    deal.createdById === ctx.session.user.id ||
    deal.participants.some((p) => p.userId === ctx.session.user.id)
  );
}

const dealRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        agentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const userId = ctx.session.user.id;
      const where: Record<string, unknown> = { companyId: auth.empresaId };

      if (!auth.canSeeAll) {
        where.OR = [
          { createdById: userId },
          { participants: { some: { userId } } },
        ];
      }
      if (input.status) where.status = input.status;
      if (input.agentId && auth.canSeeAll) where.createdById = input.agentId;
      if (input.search && auth.canSeeAll) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { property: { title: { contains: input.search, mode: "insensitive" } } },
        ];
      }

      return ctx.db.deal.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, price: true, currency: true } },
          interesado: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          participants: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
          commissions: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const deal = await ctx.db.deal.findFirst({
        where: { id: input.id, companyId: auth.empresaId },
        include: {
          property: {
            include: {
              photos: { select: { id: true, url: true, isPrimary: true } },
            },
          },
          interesado: true,
          createdBy: { select: { id: true, name: true, image: true } },
          participants: {
            include: {
              user: { select: { id: true, name: true, image: true, role: true } },
            },
          },
          commissions: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      });
      if (!deal) throw new Error("Operación no encontrada");
      if (!(await canEditDeal(ctx, auth, deal))) {
        throw new Error("No tienes acceso a esta operación");
      }
      return deal;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        propertyId: z.string().min(1),
        interesadoId: z.string().optional(),
        salePrice: z.number().optional(),
        commissionPct: z.number().optional(),
        notes: z.string().optional(),
        participants: z.array(participantSchema).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const property = await ctx.db.property.findFirst({
        where: { id: input.propertyId, companyId: auth.empresaId },
      });
      if (!property) throw new Error("Propiedad no encontrada en esta empresa");

      if (input.interesadoId) {
        const interesado = await ctx.db.interesado.findFirst({
          where: { id: input.interesadoId, companyId: auth.empresaId },
        });
        if (!interesado) throw new Error("Interesado no encontrado en esta empresa");
      }

      const participantIds = await ctx.db.user.findMany({
        where: { id: { in: input.participants.map((p) => p.userId) }, companyId: auth.empresaId },
        select: { id: true },
      });
      const validIds = new Set(participantIds.map((u) => u.id));

      const { participants, ...data } = input;
      const allParticipants = [
        { userId: ctx.session.user.id, role: "PRIMARY" as const, sharePct: undefined },
        ...participants.filter((p) => p.userId !== ctx.session.user.id && validIds.has(p.userId)),
      ];
      return ctx.db.deal.create({
        data: {
          ...data,
          companyId: auth.empresaId,
          createdById: ctx.session.user.id,
          participants: {
            create: allParticipants.map((p) => ({
              userId: p.userId,
              role: p.role,
              sharePct: p.sharePct ?? null,
            })),
          },
        },
        include: {
          participants: { include: { user: { select: { id: true, name: true } } } },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        status: z.enum(["OPEN", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST", "CANCELLED"]).optional(),
        salePrice: z.number().optional(),
        commissionPct: z.number().optional(),
        notes: z.string().optional(),
        interesadoId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const { id, ...data } = input;
      const deal = await ctx.db.deal.findFirst({
        where: { id, companyId: auth.empresaId },
        include: { participants: true },
      });
      if (!deal) throw new Error("Operación no encontrada");
      if (!(await canEditDeal(ctx, auth, deal))) throw new Error("Sin permisos");
      return ctx.db.deal.update({ where: { id }, data });
    }),

  addParticipant: protectedProcedure
    .input(z.object({ dealId: z.string(), participant: participantSchema }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const deal = await ctx.db.deal.findFirst({
        where: { id: input.dealId, companyId: auth.empresaId },
        include: { participants: true },
      });
      if (!deal) throw new Error("Operación no encontrada");
      if (!(await canEditDeal(ctx, auth, deal))) throw new Error("Sin permisos");
      if (input.participant.role === "PRIMARY") {
        throw new Error("El agente principal es el que creó la operación");
      }
      const user = await ctx.db.user.findUnique({ where: { id: input.participant.userId } });
      if (!user || user.companyId !== auth.empresaId) {
        throw new Error("El agente no pertenece a esta empresa");
      }
      const already = deal.participants.some((p) => p.userId === input.participant.userId);
      if (already) throw new Error("Ese agente ya participa en la operación");
      if (input.participant.userId === deal.createdById) {
        throw new Error("El agente principal no puede añadirse como co-broker");
      }
      return ctx.db.dealParticipant.create({
        data: {
          dealId: input.dealId,
          userId: input.participant.userId,
          role: input.participant.role,
          sharePct: input.participant.sharePct ?? null,
        },
        include: { user: { select: { id: true, name: true, image: true } } },
      });
    }),

  removeParticipant: protectedProcedure
    .input(z.object({ dealId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const deal = await ctx.db.deal.findFirst({
        where: { id: input.dealId, companyId: auth.empresaId },
        include: { participants: true },
      });
      if (!deal) throw new Error("Operación no encontrada");
      if (!(await canEditDeal(ctx, auth, deal))) throw new Error("Sin permisos");
      if (input.userId === deal.createdById) throw new Error("El agente principal no puede quitarse a sí mismo");
      const participant = deal.participants.find(
        (p) => p.userId === input.userId && !(p.role === "PRIMARY" && deal.participants.filter((x) => x.role === "PRIMARY").length === 1)
      );
      if (!participant) throw new Error("Participante no encontrado");
      await ctx.db.dealParticipant.delete({ where: { id: participant.id } });
      return { success: true };
    }),

  closeDeal: protectedProcedure
    .input(z.object({ id: z.string(), salePrice: z.number().optional(), commissionPct: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const deal = await ctx.db.deal.findFirst({
        where: { id: input.id, companyId: auth.empresaId },
        include: { participants: true, property: true },
      });
      if (!deal) throw new Error("Operación no encontrada");
      if (!(await canEditDeal(ctx, auth, deal))) throw new Error("Sin permisos");

      const salePrice = input.salePrice ?? deal.salePrice ?? Number(deal.property.price);
      const commissionPct = input.commissionPct ?? deal.commissionPct ?? 3;
      const totalCommission = Number(salePrice) * (commissionPct / 100);

      const participants = deal.participants;
      const shares = participants.map((p) => {
        const weight = p.sharePct ?? 100 / participants.length;
        return { userId: p.userId, amount: (totalCommission * weight) / 100 };
      });

      const updated = await ctx.db.$transaction([
        ctx.db.deal.update({
          where: { id: deal.id },
          data: { status: "CLOSED_WON", salePrice, commissionPct, totalCommission },
        }),
        ctx.db.property.update({
          where: { id: deal.propertyId },
          data: { status: "SOLD" },
        }),
        ctx.db.commission.deleteMany({ where: { dealId: deal.id } }),
        ...shares.map((s) =>
          ctx.db.commission.create({
            data: {
              dealId: deal.id,
              userId: s.userId,
              companyId: auth.empresaId,
              amount: s.amount,
              currency: deal.property.currency,
              notes: `Comisión operación ${deal.title}`,
            },
          })
        ),
      ]);

      return updated;
    }),

  reopenDeal: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const deal = await ctx.db.deal.findFirst({
        where: { id: input.id, companyId: auth.empresaId },
        include: { participants: true, property: true },
      });
      if (!deal) throw new Error("Operación no encontrada");
      if (!(await canEditDeal(ctx, auth, deal))) throw new Error("Sin permisos");
      await ctx.db.$transaction([
        ctx.db.commission.deleteMany({ where: { dealId: deal.id } }),
        ctx.db.deal.update({
          where: { id: deal.id },
          data: { status: "NEGOTIATION", totalCommission: null },
        }),
        ctx.db.property.update({
          where: { id: deal.propertyId },
          data: { status: "ACTIVE" },
        }),
      ]);
      return { success: true };
    }),

  updateCommissionStatus: protectedProcedure
    .input(
      z.object({
        commissionId: z.string(),
        status: z.enum(["PENDING", "PAID", "CANCELLED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const commission = await ctx.db.commission.findFirst({
        where: { id: input.commissionId, companyId: auth.empresaId },
      });
      if (!commission) throw new Error("Comisión no encontrada");
      if (!auth.canSeeAll && commission.userId !== ctx.session.user.id) {
        throw new Error("Sin permisos");
      }
      return ctx.db.commission.update({
        where: { id: input.commissionId },
        data: {
          status: input.status,
          paidAt: input.status === "PAID" ? new Date() : null,
        },
      });
    }),
});

export default dealRouter;