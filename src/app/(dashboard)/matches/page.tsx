"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Target, MapPin, Ruler, Banknote, AlertCircle } from "lucide-react";

const SCORE_STYLES = [
  { min: 85, bg: "bg-emerald-600", text: "text-white" },
  { min: 50, bg: "bg-amber-500", text: "text-white" },
  { min: 0, bg: "bg-gray-200", text: "text-gray-700" },
];

function scoreClass(score: number) {
  return SCORE_STYLES.find((s) => score >= s.min)!;
}

export default function MatchesPage() {
  const [minScore, setMinScore] = useState(0);
  const { data, isLoading } = trpc.match.list.useQuery({ minScore });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
          <p className="text-gray-600">
            Interesados cruzados automáticamente con el inventario disponible
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600" htmlFor="minscore">
            Puntuación mínima
          </label>
          <select
            id="minscore"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={0}>Todos</option>
            <option value={25}>25%</option>
            <option value={50}>50%</option>
            <option value={85}>85%</option>
          </select>
        </div>
      </div>

      {data && (
        <div className="flex gap-4 text-sm">
          <span className="rounded-lg bg-gray-100 px-3 py-1.5">
            {data.interesadosConMatch} interesados con coincidencia
          </span>
          <span className="rounded-lg bg-gray-100 px-3 py-1.5">
            {data.totalMatches} matches totales
          </span>
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-gray-500">Calculando matches...</p>
      )}

      {!isLoading && data?.grupos.length === 0 && (
        <div className="rounded-xl bg-white p-10 text-center ring-1 ring-gray-950/5">
          <Target className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-900">Sin matches por ahora</p>
          <p className="mt-1 text-sm text-gray-500">
            Completa los criterios de búsqueda en tus interesados para cruzar
            contra las propiedades activas.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {data?.grupos.map((g) => (
          <section
            key={g.agent.id}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {g.agent.name ?? g.agent.email}
              </h2>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                {g.total} matches
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {g.matches.map((m) => (
                <div
                  key={`${m.interesado.id}-${m.propiedad.id}`}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/interesados/${m.interesado.id}`}
                      className="font-medium text-gray-900 hover:text-red-600"
                    >
                      {m.interesado.name}
                    </Link>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreClass(m.score).bg} ${scoreClass(m.score).text}`}
                    >
                      {m.score}%
                    </span>
                  </div>

                  {m.interesado.isCold && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Frío: {m.interesado.daysSinceActivity} días sin contacto
                    </p>
                  )}

                  <Link
                    href={`/properties/${m.propiedad.id}`}
                    className="mt-2 block rounded-md bg-gray-50 p-3 text-sm hover:bg-gray-100"
                  >
                    <p className="font-medium text-gray-800">
                      {m.propiedad.title}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {m.propiedad.district ?? m.propiedad.city}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        {m.propiedad.area} m²
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Banknote className="h-3 w-3" />S/{" "}
                        {m.propiedad.price.toLocaleString("es-PE")}
                      </span>
                    </p>
                  </Link>

                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {m.razones.map((r) => (
                      <li
                        key={r.label}
                        title={r.detalle}
                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                      >
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}