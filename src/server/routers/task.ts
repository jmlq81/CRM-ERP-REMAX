import { router, protectedProcedure, getAuth } from "../trpc";
import { z } from "zod";

const taskRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        completed: z.boolean().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const where: Record<string, unknown> = { companyId: auth.empresaId };
      if (!auth.canSeeAll) {
        where.userId = ctx.session.user.id;
      }
      if (input.completed !== undefined) where.completed = input.completed;

      const tasks = await ctx.db.task.findMany({
        where,
        include: { interesado: true, property: true },
        orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
        take: input.limit,
      });
      return { tasks };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.string().datetime().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
        interesadoId: z.string().optional(),
        propertyId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      return ctx.db.task.create({
        data: {
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          userId: ctx.session.user.id,
          companyId: auth.empresaId,
        },
      });
    }),

  toggleComplete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const task = await ctx.db.task.findFirst({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
      });
      if (!task) throw new Error("Tarea no encontrada");
      return ctx.db.task.update({
        where: { id: input.id },
        data: { completed: !task.completed },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      return ctx.db.task.delete({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
      });
    }),
});

export default taskRouter;