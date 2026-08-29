import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/lib/prisma";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "ADMIN" | "OWNER" | "AGENT";
  activeCompanyId?: string | null;
}

export type Role = "ADMIN" | "OWNER" | "AGENT";

export type Context = {
  db: typeof db;
  session: { user: SessionUser } | null;
  req: Request;
};

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session as { user: SessionUser & { id: string } },
    },
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      ...ctx,
      role: "ADMIN" as const,
    },
  });
});

export const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "ADMIN" && user.role !== "OWNER")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sin permisos de gestión" });
  }
  return next({ ctx });
});

export type AuthInfo = {
  role: Role;
  companyId: string;
  activeCompanyId: string | null;
  empresaId: string;
  canSeeAll: boolean;
};

export async function getAuth(ctx: {
  session: { user: { id: string } };
  db: typeof db;
}): Promise<AuthInfo> {
  const u = await ctx.db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true, companyId: true, activeCompanyId: true },
  });
  if (!u || !u.companyId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sin empresa asignada" });
  }
  const role = u.role;
  const isAdmin = role === "ADMIN";
  const empresaId = isAdmin && u.activeCompanyId ? u.activeCompanyId : u.companyId;
  return {
    role,
    companyId: u.companyId,
    activeCompanyId: u.activeCompanyId,
    empresaId,
    canSeeAll: role === "ADMIN" || role === "OWNER",
  };
}

export async function getUserRole(ctx: { session: { user: { id: string } } }) {
  const user = await db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });
  return (user?.role ?? "AGENT") as Role;
}