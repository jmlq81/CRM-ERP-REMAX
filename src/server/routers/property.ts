import { router, protectedProcedure, getAuth } from "../trpc";
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
        agentId: z.string().optional(),
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
      const auth = await getAuth(ctx);
      const property = await ctx.db.property.findFirst({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
        include: {
          photos: true,
          interesados: true,
          publications: true,
          deals: {
            include: {
              participants: {
                include: {
                  user: { select: { id: true, name: true, image: true } },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
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
        district: z.string().min(1),
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
        contactName: z.string().min(1),
        contactPhone: z.string().min(1),
        featuredText1: z.string().optional(),
        featuredText2: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const company = await ctx.db.company.findUnique({
        where: { id: auth.empresaId },
        select: { maxProperties: true },
      });
      if (company?.maxProperties != null) {
        const count = await ctx.db.property.count({ where: { companyId: auth.empresaId } });
        if (count >= company.maxProperties) {
          throw new Error(
            `Se alcanzó el tope de ${company.maxProperties} propiedades para esta empresa (para cotización de servicio por empresa)`
          );
        }
      }
      return ctx.db.property.create({
        data: { ...input, userId: ctx.session.user.id, companyId: auth.empresaId },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).passthrough())
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const { id, ...data } = input;
      return ctx.db.property.update({
        where: {
          id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      return ctx.db.property.delete({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
      });
    }),

  deletePhoto: protectedProcedure
    .input(z.object({ photoId: z.string(), propertyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const photo = await ctx.db.propertyPhoto.findFirst({
        where: {
          id: input.photoId,
          property: {
            id: input.propertyId,
            companyId: auth.empresaId,
            ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
          },
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

  valuationsByProperty: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const property = await ctx.db.property.findFirst({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
        select: { id: true },
      });
      if (!property) throw new Error("Propiedad no encontrada");
      const valuations = await ctx.db.valuation.findMany({
        where: { propertyId: property.id },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { valuedAt: "desc" },
        take: 20,
      });
      return valuations.map((v) => ({
        id: v.id,
        marketValue: Number(v.marketValue),
        currency: v.currency,
        source: v.source,
        notes: v.notes,
        valuedAt: v.valuedAt,
        userId: v.user.id,
        userName: v.user.name,
      }));
    }),

  registerValuation: protectedProcedure
    .input(
      z.object({
        propertyId: z.string(),
        marketValue: z.number().positive(),
        source: z.enum(["INSPECTION", "MARKET", "CLIENT", "OTHER"]).default("INSPECTION"),
        notes: z.string().optional(),
        valuedAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const property = await ctx.db.property.findFirst({
        where: {
          id: input.propertyId,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
        select: { id: true, currency: true },
      });
      if (!property) throw new Error("Propiedad no encontrada");
      return ctx.db.valuation.create({
        data: {
          propertyId: property.id,
          companyId: auth.empresaId,
          userId: ctx.session.user.id,
          marketValue: input.marketValue,
          currency: property.currency,
          source: input.source,
          notes: input.notes,
          valuedAt: input.valuedAt ? new Date(input.valuedAt) : new Date(),
        },
      });
    }),

  deleteValuation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const valuation = await ctx.db.valuation.findFirst({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          OR: [
            { userId: ctx.session.user.id },
            ...(auth.canSeeAll
              ? [{ property: { companyId: auth.empresaId } }]
              : []),
          ],
        },
      });
      if (!valuation) throw new Error("Valoración no encontrada");
      await ctx.db.valuation.delete({ where: { id: valuation.id } });
      return { success: true };
    }),

  marketZoneValues: protectedProcedure
    .query(async ({ ctx }) => {
      const auth = await getAuth(ctx);

      const properties = await ctx.db.property.findMany({
        where: {
          companyId: auth.empresaId,
          district: { not: null },
          area: { gt: 0 },
        },
        select: {
          city: true,
          district: true,
          type: true,
          price: true,
          area: true,
          currency: true,
        },
      });

      const zoneMap = new Map<
        string,
        {
          city: string;
          district: string;
          land: number[];
          house: number[];
          apartment: number[];
          condo: number[];
          office: number[];
          warehouse: number[];
          currency: string;
        }
      >();

      for (const p of properties) {
        const key = `${p.city}|||${p.district}`;
        if (!zoneMap.has(key)) {
          zoneMap.set(key, {
            city: p.city,
            district: p.district!,
            land: [],
            house: [],
            apartment: [],
            condo: [],
            office: [],
            warehouse: [],
            currency: p.currency,
          });
        }
        const zone = zoneMap.get(key)!;
        const pricePerM2 = Number(p.price) / (p.area as number);
        switch (p.type) {
          case "LAND":
            zone.land.push(pricePerM2);
            break;
          case "HOUSE":
            zone.house.push(pricePerM2);
            break;
          case "APARTMENT":
            zone.apartment.push(pricePerM2);
            break;
          case "CONDO":
            zone.condo.push(pricePerM2);
            break;
          case "OFFICE":
            zone.office.push(pricePerM2);
            break;
          case "WAREHOUSE":
            zone.warehouse.push(pricePerM2);
            break;
        }
      }

      const avg = (arr: number[]) =>
        arr.length > 0
          ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
          : null;

      const results = Array.from(zoneMap.values()).map((z) => {
        const landAvg = avg(z.land);
        const houseAvg = avg(z.house);
        const apartmentAvg = avg(z.apartment);
        const condoAvg = avg(z.condo);

        let construccionM2: number | null = null;
        if (houseAvg !== null && landAvg !== null) {
          construccionM2 = Math.round(houseAvg - landAvg);
        } else if (apartmentAvg !== null) {
          construccionM2 = apartmentAvg;
        } else if (condoAvg !== null) {
          construccionM2 = condoAvg;
        }

        const residencialM2 =
          avg([...z.house, ...z.apartment, ...z.condo]);

        const comercialM2 = avg([...z.office, ...z.warehouse]);

        const totalProps =
          z.land.length +
          z.house.length +
          z.apartment.length +
          z.condo.length +
          z.office.length +
          z.warehouse.length;

        return {
          city: z.city,
          district: z.district,
          currency: z.currency,
          terrenoM2: landAvg,
          construccionM2,
          residencialM2,
          comercialM2,
          totalPropiedades: totalProps,
        };
      });

      results.sort((a, b) => b.totalPropiedades - a.totalPropiedades);

      return results;
    }),

  marketEstimate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const auth = await getAuth(ctx);
      const property = await ctx.db.property.findFirst({
        where: {
          id: input.id,
          companyId: auth.empresaId,
          ...(auth.canSeeAll ? {} : { userId: ctx.session.user.id }),
        },
      });
      if (!property) throw new Error("Propiedad no encontrada");
      if (!property.area) {
        return {
          estimatedValue: null,
          avgPricePerM2: null,
          comparablesCount: 0,
          level: null,
          range: null,
        };
      }

      const area = property.area;
      const baseWhere: Record<string, unknown> = {
        id: { not: property.id },
        companyId: auth.empresaId,
        status: "ACTIVE" as const,
        price: { not: null },
        area: { gte: area * 0.7, lte: area * 1.3 },
      };

      const levels = [
        { name: "distrito", where: { type: property.type, district: property.district ?? undefined } },
        { name: "ciudad-sin-area", where: { type: property.type, city: property.city } },
        { name: "ciudad", where: { city: property.city } },
        { name: "empresa", where: {} },
      ];

      let matches: Array<{ price: number; area: number }> = [];
      let level: string | null = null;

      for (const l of levels) {
        const where = { ...baseWhere, ...l.where };
        const rows = await ctx.db.property.findMany({
          where,
          select: { price: true, area: true },
          take: 60,
        });
        const withArea = rows
          .filter((r) => r.area && r.area > 0)
          .map((r) => ({ price: Number(r.price), area: r.area as number }));
        if (withArea.length >= 3) {
          matches = withArea.slice(0, 40);
          level = l.name;
          break;
        }
        if (withArea.length > 0 && level === null) {
          matches = withArea.slice(0, 40);
          level = l.name + "-parcial";
        }
      }

      if (matches.length === 0) {
        return {
          estimatedValue: null,
          avgPricePerM2: null,
          comparablesCount: 0,
          level: null,
          range: null,
        };
      }

      const pricesPerM2 = matches.map((m) => m.price / m.area);
      const avg = pricesPerM2.reduce((a, b) => a + b, 0) / pricesPerM2.length;
      const estimated = avg * area;
      return {
        estimatedValue: Math.round(estimated),
        avgPricePerM2: Math.round(avg),
        comparablesCount: matches.length,
        level,
        range: {
          min: Math.round(estimated * 0.9),
          max: Math.round(estimated * 1.1),
        },
      };
    }),
});

export default propertyRouter;