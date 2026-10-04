import { router, protectedProcedure, getAuth } from "../trpc";
import { z } from "zod";
import { computeCold } from "@/lib/leads";

const searchCriteria = {
  searchType: z
    .enum(["HOUSE", "APARTMENT", "CONDO", "LAND", "OFFICE", "WAREHOUSE", "OTHER"])
    .nullable()
    .optional(),
  searchDistricts: z.array(z.string().min(1)).optional(),
  searchMinPrice: z.number().nonnegative().nullable().optional(),
  searchMaxPrice: z.number().nonnegative().nullable().optional(),
  searchMinArea: z.number().nonnegative().nullable().optional(),
  searchMaxArea: z.number().nonnegative().nullable().optional(),
};

const interesadoRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
        agentId: z.string().optional(),
        onlyCold: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const where: Record<string, unknown> = { companyId: auth.empresaId };
      if (!auth.canSeeAll) {
        where.userId = ctx.session.user.id;
      } else if (input.agentId) {
        where.userId = input.agentId;
      }

      if (input.status) where.status = input.status;
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { phone: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input.onlyCold) {
        where.AND = [
          { NOT: { interactions: { some: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } } } },
        ];
      }

      const [interesados, total] = await Promise.all([
        ctx.db.interesado.findMany({
          where,
          include: { property: true, interactions: true },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.interesado.count({ where }),
      ]);

      return {
        interesados: interesados.map((i) => {
          const latest = i.lastActivityAt ?? (i.interactions.length > 0
            ? i.interactions.reduce((max, x) => (x.createdAt > max ? x.createdAt : max), i.interactions[0].createdAt)
            : null);
          const cold = computeCold(latest);
          return {
            ...i,
            lastActivityAt: cold.lastActivityAt,
            isCold: cold.isCold,
            daysSinceActivity: cold.daysSinceActivity,
          };
        }),
        total,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const interesado = await ctx.db.interesado.findFirst({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
        include: { property: true, interactions: true, tasks: true },
      });
      if (!interesado) throw new Error("Interesado no encontrado");
      const latest = interesado.lastActivityAt ?? (interesado.interactions.length > 0
        ? interesado.interactions.reduce((max, x) => (x.createdAt > max ? x.createdAt : max), interesado.interactions[0].createdAt)
        : null);
      const cold = computeCold(latest);
      return {
        ...interesado,
        lastActivityAt: cold.lastActivityAt,
        isCold: cold.isCold,
        daysSinceActivity: cold.daysSinceActivity,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        source: z.enum(["WEB", "PHONE", "EMAIL", "REFERRAL", "FACEBOOK", "INSTAGRAM", "WHATSAPP", "OTHER"]).default("WEB"),
        notes: z.string().optional(),
        budget: z.number().optional(),
        propertyId: z.string().optional(),
        interestLevel: z.number().min(1).max(5).optional(),
        nextFollowUpAt: z.string().datetime().nullable().optional(),
        ...searchCriteria,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const { nextFollowUpAt, ...data } = input;
      return ctx.db.interesado.create({
        data: {
          ...data,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : undefined,
          lastActivityAt: new Date(),
          userId: ctx.session.user.id,
          companyId: auth.empresaId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        budget: z.number().optional().nullable(),
        propertyId: z.string().optional().nullable(),
        status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]).optional(),
        interestLevel: z.number().min(1).max(5).optional().nullable(),
        nextFollowUpAt: z.string().datetime().optional().nullable(),
        ...searchCriteria,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const { nextFollowUpAt, ...data } = input;
      return ctx.db.interesado.update({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
        data: {
          ...data,
          ...(nextFollowUpAt !== undefined
            ? { nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null }
            : {}),
        },
      });
    }),

  addInteraction: protectedProcedure
    .input(
      z.object({
        interesadoId: z.string(),
        type: z.enum(["CALL", "EMAIL", "SMS", "MEETING", "NOTE", "WHATSAPP"]),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const interesado = await ctx.db.interesado.findFirst({
        where: {
          id: input.interesadoId,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
      });
      if (!interesado) throw new Error("Interesado no encontrado");
      const { interesadoId, ...rest } = input;
      const interaction = await ctx.db.interaction.create({
        data: {
          ...rest,
          interesadoId,
          userId: ctx.session.user.id,
        },
      });
      await ctx.db.interesado.update({
        where: { id: interesadoId },
        data: { lastActivityAt: new Date(), coldMarkedAt: null },
      });
      return interaction;
    }),

  scheduleFollowUp: protectedProcedure
    .input(z.object({ interesadoId: z.string(), days: z.number().min(1).max(30).default(2) }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const interesado = await ctx.db.interesado.findFirst({
        where: {
          id: input.interesadoId,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
      });
      if (!interesado) throw new Error("Interesado no encontrado");

      const nextFollowUpAt = new Date();
      nextFollowUpAt.setDate(nextFollowUpAt.getDate() + input.days);
      nextFollowUpAt.setHours(9, 0, 0, 0);

      return ctx.db.interesado.update({
        where: { id: interesado.id },
        data: { nextFollowUpAt },
      });
    }),

  clearFollowUp: protectedProcedure
    .input(z.object({ interesadoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      return ctx.db.interesado.update({
        where: {
          id: input.interesadoId,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
        data: { nextFollowUpAt: null },
      });
    }),

  markColdLeads: protectedProcedure
    .mutation(async ({ ctx }) => {
      const auth = await getAuth(ctx);
      const cutoff = new Date(Date.now() - 30 * 86_400_000);
      const stale = await ctx.db.interesado.findMany({
        where: {
          companyId: auth.empresaId,
          status: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
          OR: [{ coldMarkedAt: null }, { coldMarkedAt: { lt: cutoff } }],
          NOT: {
            interactions: { some: { createdAt: { gte: cutoff } } },
          },
        },
        select: { id: true },
      });
      if (stale.length === 0) return { marked: 0 };
      const ids = stale.map((s) => s.id);
      const res = await ctx.db.interesado.updateMany({
        where: { id: { in: ids } },
        data: { coldMarkedAt: new Date() },
      });
      return { marked: res.count };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      return ctx.db.interesado.delete({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
      });
    }),
});

export default interesadoRouter;