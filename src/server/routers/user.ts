import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/password";

const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        agency: true,
        bio: true,
        passwordHash: true,
      },
    });
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return { ...rest, hasPassword: !!passwordHash };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        agency: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),

  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { passwordHash: true },
      });
      if (!user) throw new Error("Usuario no encontrado");

      if (user.passwordHash) {
        if (!input.currentPassword) {
          throw new Error("Debes ingresar tu contraseña actual");
        }
        if (!verifyPassword(input.currentPassword, user.passwordHash)) {
          throw new Error("La contraseña actual es incorrecta");
        }
      }

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { passwordHash: hashPassword(input.newPassword) },
      });
      return { success: true };
    }),
});

export default userRouter;
