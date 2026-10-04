import { router, protectedProcedure, getAuth } from "../trpc";
import { z } from "zod";
import { computeCold } from "@/lib/leads";

const RESIDENTIAL = ["HOUSE", "APARTMENT", "CONDO"] as const;

function normalizeDistrict(value: string | null | undefined) {
  if (!value) return null;
  return value.trim().toLowerCase();
}

type MatchReason = {
  label: string;
  detalle: string;
};

const matchRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        minScore: z.number().min(0).max(100).default(0),
        districtId: z.string().optional(),
        limit: z.number().default(60),
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

      const [interesados, propiedades] = await Promise.all([
        ctx.db.interesado.findMany({
          where: {
            ...where,
            status: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            budget: true,
            searchType: true,
            searchDistricts: true,
            searchMinPrice: true,
            searchMaxPrice: true,
            searchMinArea: true,
            searchMaxArea: true,
            lastActivityAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
          take: input.limit,
        }),
        ctx.db.property.findMany({
          where: { companyId: auth.empresaId, status: "ACTIVE" },
          select: {
            id: true,
            title: true,
            type: true,
            price: true,
            currency: true,
            area: true,
            district: true,
            city: true,
          },
          take: 300,
        }),
      ]);

      const results = [];

      for (const i of interesados) {
        const districts = i.searchDistricts.map(normalizeDistrict).filter(Boolean) as string[];
        const minPrice = i.searchMinPrice !== null ? Number(i.searchMinPrice) : i.budget !== null ? Number(i.budget) * 0.85 : null;
        const maxPrice = i.searchMaxPrice !== null ? Number(i.searchMaxPrice) : i.budget !== null ? Number(i.budget) * 1.15 : null;

        for (const p of propiedades) {
          let score = 0;
          const razones: MatchReason[] = [];

          if (i.searchType) {
            const wanted = i.searchType;
            const isResidential =
              (RESIDENTIAL as readonly string[]).includes(wanted) &&
              (RESIDENTIAL as readonly string[]).includes(p.type);
            if (wanted === p.type || isResidential) {
              score += 35;
              razones.push({ label: "Tipo coincide", detalle: "Mismo tipo de inmueble" });
            }
          }

          const propDistrict = normalizeDistrict(p.district);
          if (districts.length > 0 && propDistrict && districts.includes(propDistrict)) {
            score += 35;
            razones.push({ label: "Distrito coincide", detalle: p.district ?? "" });
          }

          if (p.area && p.area > 0) {
            const area = p.area;
            if (i.searchMinArea !== null && i.searchMaxArea !== null) {
              if (area >= i.searchMinArea && area <= i.searchMaxArea) {
                score += 15;
                razones.push({ label: "Área dentro del rango", detalle: `${area} m²` });
              }
            }
          }

          const price = Number(p.price);
          if (minPrice !== null && maxPrice !== null) {
            if (price >= minPrice && price <= maxPrice) {
              score += 15;
              razones.push({ label: "Precio dentro del rango", detalle: `S/ ${price.toLocaleString("es-PE")}` });
            }
          }

          if (score === 0) continue;

          const cold = computeCold(i.lastActivityAt);
          results.push({
            score,
            razones,
            interesado: {
              id: i.id,
              name: i.name,
              email: i.email,
              phone: i.phone,
              status: i.status,
              isCold: cold.isCold,
              daysSinceActivity: cold.daysSinceActivity,
              agent: i.user,
            },
            propiedad: {
              id: p.id,
              title: p.title,
              type: p.type,
              price,
              currency: p.currency,
              area: p.area,
              district: p.district,
              city: p.city,
            },
          });
        }
      }

      results.sort((a, b) => b.score - a.score);

      const byAgent = new Map<string, { agent: { id: string; name: string | null; email: string }; matches: typeof results }>();
      for (const r of results) {
        if (r.score < input.minScore) continue;
        const key = r.interesado.agent.id;
        if (!byAgent.has(key)) {
          byAgent.set(key, { agent: r.interesado.agent, matches: [] });
        }
        byAgent.get(key)!.matches.push(r);
      }

      const grupos = Array.from(byAgent.values())
        .map((g) => ({
          agent: g.agent,
          total: g.matches.length,
          matches: g.matches.slice(0, 20),
        }))
        .sort((a, b) => b.total - a.total);

      const topPorInteresado = new Map<string, number>();
      for (const r of results) {
        if (r.score < input.minScore) continue;
        topPorInteresado.set(r.interesado.id, (topPorInteresado.get(r.interesado.id) ?? 0) + 1);
      }

      return {
        grupos,
        totalMatches: Array.from(topPorInteresado.values()).reduce((a, b) => a + b, 0),
        interesadosConMatch: topPorInteresado.size,
      };
    }),
});

export default matchRouter;