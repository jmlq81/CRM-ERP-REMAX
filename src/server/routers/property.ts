import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

function storagePathFromUrl(url: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (base && url.startsWith(base)) return url.slice(base.length).replace(/^\/storage\/v1\/object\/public\/properties\//, "");
  return url.replace(/^.*\/properties\//, "");
}

const propertyRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        city: z.string().optional(),
        status: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        type: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { userId: ctx.session.user.id };

      if (input.city) where.city = input.city;
      if (input.status) where.status = input.status;
      if (input.type) where.type = input.type;
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { address: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input.minPrice || input.maxPrice) {
        where.price = {};
        if (input.minPrice) (where.price as Record<string, unknown>).gte = input.minPrice;
        if (input.maxPrice) (where.price as Record<string, unknown>).lte = input.maxPrice;
      }

      const [properties, total] = await Promise.all([
        ctx.db.property.findMany({
          where,
          include: { photos: true },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.property.count({ where }),
      ]);

      return { properties, total };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const property = await ctx.db.property.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { photos: true, leads: true, publications: true },
      });
      if (!property) throw new Error("Propiedad no encontrada");
      return property;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        currency: z.enum(["PEN", "USD", "EUR"]).default("PEN"),
        address: z.string().min(1),
        city: z.string().min(1),
        district: z.string().optional(),
        state: z.string().optional(),
        country: z.string().default("Peru"),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        area: z.number().optional(),
        type: z.enum(["HOUSE", "APARTMENT", "CONDO", "LAND", "OFFICE", "WAREHOUSE", "OTHER"]).default("HOUSE"),
        features: z.array(z.string()).default([]),
        yearBuilt: z.number().optional(),
        parking: z.number().optional(),
        floors: z.number().optional(),
        videoUrl: z.string().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        featuredText1: z.string().optional(),
        featuredText2: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.property.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).passthrough())
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.property.update({
        where: { id, userId: ctx.session.user.id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.property.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  deletePhoto: protectedProcedure
    .input(z.object({ photoId: z.string(), propertyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const photo = await ctx.db.propertyPhoto.findFirst({
        where: {
          id: input.photoId,
          property: { id: input.propertyId, userId: ctx.session.user.id },
        },
      });
      if (!photo) throw new Error("Foto no encontrada");
      await ctx.db.propertyPhoto.delete({ where: { id: photo.id } });
      const path = storagePathFromUrl(photo.url);
      if (path) {
        await supabase.storage.from("properties").remove([path]).catch(() => {});
      }
      return { success: true };
    }),
});

export default propertyRouter;
