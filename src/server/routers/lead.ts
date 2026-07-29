import { router, protectedProcedure } from "../trpc";
import { z } from "zod";

const leadRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { userId: ctx.session.user.id };

      if (input.status) where.status = input.status;
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
          { phone: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [leads, total] = await Promise.all([
        ctx.db.lead.findMany({
          where,
          include: { property: true, interactions: true },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.lead.count({ where }),
      ]);

      return { leads, total };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { property: true, interactions: true, tasks: true },
      });
      if (!lead) throw new Error("Lead no encontrado");
      return lead;
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lead.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lead.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { status: input.status },
      });
    }),

  addInteraction: protectedProcedure
    .input(
      z.object({
        leadId: z.string(),
        type: z.enum(["CALL", "EMAIL", "SMS", "MEETING", "NOTE", "WHATSAPP"]),
        content: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.interaction.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.lead.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});

export default leadRouter;
