import { router, protectedProcedure, adminProcedure, getAuth } from "../trpc";
import { z } from "zod";
import { hashPassword } from "@/lib/password";

const RUC_PATTERN = /^\d{11}$/;

const rucSchema = z
  .string()
  .regex(RUC_PATTERN, "El RUC debe tener 11 dígitos numéricos (identificador tributario de Perú, como el CPF en Brasil)");

const empresaRouter = router({
  context: protectedProcedure.query(async ({ ctx }) => {
    const auth = await getAuth(ctx);
    const [empresa, all] = await Promise.all([
      ctx.db.company.findUnique({ where: { id: auth.empresaId } }),
      ctx.db.company.count(),
    ]);
    if (!empresa) throw new Error("Empresa no encontrada");
    return {
      empresaId: auth.empresaId,
      nombre: empresa.name,
      ruc: empresa.ruc,
      rol: auth.role,
      totalEmpresas: auth.role === "ADMIN" ? all : undefined,
    };
  }),

  list: adminProcedure.query(async ({ ctx }) => {
    const companies = await ctx.db.company.findMany({
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: {
          select: {
            users: true,
            properties: true,
            interesados: true,
            deals: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return companies.map((c) => {
      const counts = {
        OWNER: 0,
        AGENT: 0,
        ADMIN: 0,
      } as Record<string, number>;
      const owners: { id: string; name: string; email: string }[] = [];
      const agents: { id: string; name: string; email: string }[] = [];
      for (const u of c.users) {
        counts[u.role] = (counts[u.role] ?? 0) + 1;
        if (u.role === "OWNER") owners.push({ id: u.id, name: u.name ?? u.email, email: u.email });
        if (u.role === "AGENT") agents.push({ id: u.id, name: u.name ?? u.email, email: u.email });
      }
      return {
        id: c.id,
        name: c.name,
        ruc: c.ruc,
        active: c.active,
        maxAgents: c.maxAgents,
        maxProperties: c.maxProperties,
        createdAt: c.createdAt,
        counts,
        owners,
        agents,
        userCount: c.users.filter((u) => u.role !== "ADMIN").length,
        totalUsers: c._count.users,
        properties: c._count.properties,
        interesados: c._count.interesados,
        deals: c._count.deals,
        tasks: c._count.tasks,
      };
    });
  }),

  switch: protectedProcedure
    .input(z.object({ empresaId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      if (auth.role !== "ADMIN") {
        throw new Error("Solo el administrador puede cambiar de empresa");
      }
      const empresa = await ctx.db.company.findFirst({
        where: { id: input.empresaId, active: true },
      });
      if (!empresa) throw new Error("Empresa no encontrada");
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { activeCompanyId: input.empresaId },
      });
      return { empresaId: input.empresaId, nombre: empresa.name };
    }),

  createForMe: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nombre requerido"),
        ruc: rucSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { id: ctx.session.user.id } });
      if (!user) throw new Error("Usuario no encontrado");
      if (user.companyId) throw new Error("Tu cuenta ya pertenece a una empresa");

      const [existingRuc, existingCompany] = await Promise.all([
        ctx.db.company.findUnique({ where: { ruc: input.ruc } }),
        ctx.db.company.findFirst({ where: { name: { equals: input.name, mode: "insensitive" } } }),
      ]);
      if (existingRuc) throw new Error("Ya existe una empresa con ese RUC");
      if (existingCompany) throw new Error("Ya existe una empresa con ese nombre");

      const empresa = await ctx.db.$transaction(async (tx) => {
        const created = await tx.company.create({
          data: {
            name: input.name,
            ruc: input.ruc,
            maxAgents: 5,
            maxProperties: 30,
            users: { connect: { id: user.id } },
          },
        });
        await tx.user.update({
          where: { id: user.id },
          data: { role: "OWNER", activeCompanyId: created.id },
        });
        return created;
      });

      return { id: empresa.id, name: empresa.name, ruc: empresa.ruc };
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nombre requerido"),
        ruc: rucSchema,
        ownerName: z.string().min(1, "Nombre del dueño requerido"),
        ownerEmail: z.string().email("Email inválido"),
        ownerPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
        maxAgents: z.number().int().min(0).optional(),
        maxProperties: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({ where: { email: input.ownerEmail } });
      if (existingUser) throw new Error("Ya existe un usuario con ese email");
      const existingRuc = await ctx.db.company.findUnique({ where: { ruc: input.ruc } });
      if (existingRuc) throw new Error("Ya existe una empresa con ese RUC");
      const existingCompany = await ctx.db.company.findFirst({
        where: { name: { equals: input.name, mode: "insensitive" } },
      });
      if (existingCompany) throw new Error("Ya existe una empresa con ese nombre");

      const empresa = await ctx.db.company.create({
        data: {
          name: input.name,
          ruc: input.ruc,
          maxAgents: input.maxAgents ?? null,
          maxProperties: input.maxProperties ?? null,
          users: {
            create: {
              name: input.ownerName,
              email: input.ownerEmail,
              passwordHash: hashPassword(input.ownerPassword),
              role: "OWNER",
            },
          },
        },
      });
      return { id: empresa.id, name: empresa.name, ruc: empresa.ruc };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Nombre requerido").optional(),
        ruc: rucSchema.optional(),
        active: z.boolean().optional(),
        maxAgents: z.number().int().min(0).nullable().optional(),
        maxProperties: z.number().int().min(0).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const empresa = await ctx.db.company.findUnique({ where: { id } });
      if (!empresa) throw new Error("Empresa no encontrada");
      if (data.name && data.name !== empresa.name) {
        const dup = await ctx.db.company.findFirst({
          where: { id: { not: id }, name: { equals: data.name, mode: "insensitive" } },
        });
        if (dup) throw new Error("Ya existe una empresa con ese nombre");
      }
      if (data.ruc && data.ruc !== empresa.ruc) {
        const dup = await ctx.db.company.findUnique({ where: { ruc: data.ruc } });
        if (dup) throw new Error("Ya existe una empresa con ese RUC");
      }
      return ctx.db.company.update({ where: { id }, data });
    }),
});

export default empresaRouter;