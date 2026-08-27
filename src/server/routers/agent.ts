import { router, adminProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";

const agentRouter = router({
  listSimple: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });
  }),

  list: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: { role: { in: ["AGENT", "ADMIN"] } },
      orderBy: { name: "asc" },
    });

    const withStats = await Promise.all(
      users.map(async (u) => {
        const [properties, activeProperties, leads, activeLeads, pendingTasks, deals, closedDeals, pendingCommissions, paidCommissions, followUpsDue] =
          await Promise.all([
            ctx.db.property.count({ where: { userId: u.id } }),
            ctx.db.property.count({ where: { userId: u.id, status: "ACTIVE" } }),
            ctx.db.lead.count({ where: { userId: u.id } }),
            ctx.db.lead.count({ where: { userId: u.id, status: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } } }),
            ctx.db.task.count({ where: { userId: u.id, completed: false } }),
            ctx.db.deal.count({
              where: { OR: [{ createdById: u.id }, { participants: { some: { userId: u.id } } }] },
            }),
            ctx.db.deal.count({
              where: {
                status: "CLOSED_WON",
                OR: [{ createdById: u.id }, { participants: { some: { userId: u.id } } }],
              },
            }),
            ctx.db.commission.aggregate({
              where: { userId: u.id, status: "PENDING" },
              _sum: { amount: true },
            }),
            ctx.db.commission.aggregate({
              where: { userId: u.id, status: "PAID" },
              _sum: { amount: true },
            }),
            ctx.db.lead.count({
              where: { userId: u.id, nextFollowUpAt: { lte: new Date() } },
            }),
          ]);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          role: u.role,
          createdAt: u.createdAt,
          stats: {
            properties,
            activeProperties,
            leads,
            activeLeads,
            pendingTasks,
            deals,
            closedDeals,
            pendingCommissions: pendingCommissions._sum.amount,
            paidCommissions: paidCommissions._sum.amount,
            followUpsDue,
          },
        };
      })
    );

    return withStats;
  }),

  updateRole: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["ADMIN", "AGENT"]) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id && input.role !== "ADMIN") {
        throw new Error("No puedes degradarte a ti mismo");
      }
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, role: true },
      });
    }),
});

export default agentRouter;