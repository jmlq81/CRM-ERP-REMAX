import { router, managerProcedure, protectedProcedure, getAuth } from "../trpc";
import { z } from "zod";
import { hashPassword } from "@/lib/password";

const agentRouter = router({
  listSimple: protectedProcedure.query(async ({ ctx }) => {
    const auth = await getAuth(ctx);
    return ctx.db.user.findMany({
      where: { companyId: auth.empresaId },
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

  list: managerProcedure.query(async ({ ctx }) => {
    const auth = await getAuth(ctx);
    const users = await ctx.db.user.findMany({
      where: { companyId: auth.empresaId },
      orderBy: { name: "asc" },
    });

    const withStats = await Promise.all(
      users.map(async (u) => {
        const [properties, activeProperties, interesados, activeInteresados, pendingTasks, deals, closedDeals, pendingCommissions, paidCommissions, followUpsDue] =
          await Promise.all([
            ctx.db.property.count({ where: { userId: u.id } }),
            ctx.db.property.count({ where: { userId: u.id, status: "ACTIVE" } }),
            ctx.db.interesado.count({ where: { userId: u.id } }),
            ctx.db.interesado.count({ where: { userId: u.id, status: { notIn: ["CLOSED_WON", "CLOSED_LOST"] } } }),
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
            ctx.db.interesado.count({
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
            interesados,
            activeInteresados,
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

  createUser: managerProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nombre requerido"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
        role: z.enum(["OWNER", "AGENT"]).default("AGENT"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const existing = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (existing) throw new Error("Ya existe un usuario con ese email");

      const company = await ctx.db.company.findUnique({
        where: { id: auth.empresaId },
        select: { maxAgents: true, users: { select: { role: true } } },
      });
      if (company?.maxAgents != null) {
        const current = company.users.filter((u) => u.role !== "ADMIN").length;
        if (current >= company.maxAgents) {
          throw new Error(
            `Se alcanzó el tope de ${company.maxAgents} usuarios para esta empresa (para cotización de servicio por empresa)`
          );
        }
      }

      return ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: hashPassword(input.password),
          role: input.role,
          companyId: auth.empresaId,
        },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  updateRole: managerProcedure
    .input(z.object({ userId: z.string(), role: z.enum(["OWNER", "AGENT"]) }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const target = await ctx.db.user.findUnique({ where: { id: input.userId } });
      if (!target || target.companyId !== auth.empresaId) {
        throw new Error("El usuario no pertenece a esta empresa");
      }
      if (target.role === "ADMIN") {
        throw new Error("No puedes cambiar el rol de un administrador de plataforma");
      }
      const ownersInCompany = await ctx.db.user.count({
        where: { companyId: auth.empresaId, role: "OWNER" },
      });
      if (target.role === "OWNER" && input.role !== "OWNER" && ownersInCompany <= 1) {
        throw new Error("La empresa debe tener al menos un dueño");
      }
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, role: true },
      });
    }),

  deactivateUser: managerProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      if (input.userId === ctx.session.user.id) {
        throw new Error("No puedes desactivarte a ti mismo");
      }
      const target = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, companyId: true, role: true },
      });
      if (!target || target.companyId !== auth.empresaId) {
        throw new Error("El usuario no pertenece a esta empresa");
      }
      const owners = await ctx.db.user.count({
        where: { companyId: auth.empresaId, role: "OWNER" },
      });
      if (target.role === "OWNER" && owners <= 1) {
        throw new Error("La empresa debe tener al menos un dueño");
      }
      await ctx.db.user.delete({ where: { id: input.userId } });
      return { success: true };
    }),
});

export default agentRouter;