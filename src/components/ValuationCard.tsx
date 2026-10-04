"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BadgeCheck, Trash2, TrendingDown, Scale } from "lucide-react";
import { trafficLightFor, VALUATION_BANDS } from "@/lib/leads";

const SOURCE_LABELS: Record<string, string> = {
  INSPECTION: "Inspección",
  MARKET: "Comparables de mercado",
  CLIENT: "Requerimiento del cliente",
  OTHER: "Otro",
};

const TRAFFIC_LIGHTS = {
  GREEN: {
    label: "Dentro del rango",
    className: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  YELLOW: {
    label: "Revisar precio",
    className: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500",
  },
  RED: {
    label: "Fuera del mercado",
    className: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
} as const;

type TrafficLightKey = keyof typeof TRAFFIC_LIGHTS;

function comparisonBadge(diff: number | null): {
  label: string;
  className: string;
  key: TrafficLightKey;
} | null {
  if (diff === null) return null;
  const light = TRAFFIC_LIGHTS[trafficLightFor(diff) ?? "GREEN"];
  const direction = diff > 0 ? "por encima" : "por debajo";
  return {
    key: trafficLightFor(diff) ?? "GREEN",
    label:
      Math.abs(diff) <= 0.05
        ? light.label
        : `${light.label} · ${Math.abs(diff).toFixed(0)}% ${direction}`,
    className: light.className,
  };
}

export function ValuationCard({
  propertyId,
  price,
  currency,
  area,
  propertyUserId,
}: {
  propertyId: string;
  price: number;
  currency: string;
  area: number | null;
  propertyUserId: string;
}) {
  const utils = trpc.useUtils();
  const { data: user } = trpc.user.me.useQuery();
  const { data: valuations, isLoading } = trpc.property.valuationsByProperty.useQuery(
    { id: propertyId }
  );
  const { data: estimate } = trpc.property.marketEstimate.useQuery(
    { id: propertyId },
    { enabled: area != null }
  );

  const registerValuation = trpc.property.registerValuation.useMutation({
    onSuccess: () => {
      utils.property.valuationsByProperty.invalidate({ id: propertyId });
      setMarketValue("");
      setSource("INSPECTION");
      setNotes("");
      setValuedAt("");
    },
  });
  const deleteValuation = trpc.property.deleteValuation.useMutation({
    onSuccess: () => {
      utils.property.valuationsByProperty.invalidate({ id: propertyId });
    },
  });
  const generateValuation = trpc.property.generateValuation.useMutation({
    onSuccess: () => {
      utils.property.valuationsByProperty.invalidate({ id: propertyId });
    },
  });

  const [marketValue, setMarketValue] = useState("");
  const [source, setSource] = useState("INSPECTION");
  const [notes, setNotes] = useState("");
  const [valuedAt, setValuedAt] = useState("");

  const canEdit =
    user?.role === "ADMIN" || user?.role === "OWNER" || user?.id === propertyUserId;
  const canGenerate = user?.role === "TASADOR" || user?.role === "ADMIN";

  const pricePerM2 = area && area > 0 ? price / area : null;
  const latest = valuations && valuations.length > 0 ? valuations[0] : null;
  const reference = latest ? latest.marketValue : estimate?.estimatedValue ?? null;
  const diff = price && reference ? ((price - reference) / reference) * 100 : null;
  const badge = comparisonBadge(diff);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      <div className="mb-4 flex items-center gap-2">
        <BadgeCheck className="h-5 w-5 text-red-600" />
        <h2 className="text-lg font-semibold text-gray-900">Valoración</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Precio de venta</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {formatCurrency(price, currency)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {pricePerM2
              ? `${formatCurrency(pricePerM2, currency)} / m²`
              : "Sin área registrada"}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Valor de mercado</p>
          {reference !== null ? (
            <>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {formatCurrency(reference, currency)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {latest
                  ? `Registrado el ${formatDate(latest.valuedAt)}`
                  : "Estimado automático del mercado"}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-gray-400">Sin datos aún</p>
              <p className="mt-1 text-xs text-gray-500">
                Registra una valoración o agrega comparables.
              </p>
            </>
          )}
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Comparación con el mercado</p>
          {badge ? (
            <span
              className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
              <Scale className="h-4 w-4" />
              Sin suficiente información
            </div>
          )}
        </div>
      </div>

      {badge && (
        <div className="mt-4 rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              Semáforo de precio
            </p>
            <span className="text-xs text-gray-500">
              Verde ±{VALUATION_BANDS.greenMax}% · Amarillo ±
              {VALUATION_BANDS.yellowMax}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(["GREEN", "YELLOW", "RED"] as const).map((k) => {
              const l = TRAFFIC_LIGHTS[k];
              const active = badge.key === k;
              return (
                <div key={k} className="flex flex-1 flex-col gap-1">
                  <div
                    className={`h-2.5 rounded-full ${l.dot} ${active ? "" : "opacity-25"}`}
                  />
                  <span
                    className={`text-center text-xs ${active ? "font-semibold text-gray-900" : "text-gray-400"}`}
                  >
                    {l.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canGenerate && estimate?.estimatedValue != null && area != null && (
        <button
          type="button"
          onClick={() => generateValuation.mutate({ propertyId })}
          disabled={generateValuation.isPending}
          className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {generateValuation.isPending
            ? "Generando tasación..."
            : "Generar tasación por comparables (máx. 8)"}
        </button>
      )}

      {!canGenerate && (
        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          La generación de tasaciones por comparables está reservada al rol
          Tasador.
        </p>
      )}

      {estimate?.estimatedValue != null && area != null && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-gray-200 p-4">
          <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-semibold text-gray-900">Estimado del mercado:</span>{" "}
              {formatCurrency(estimate.estimatedValue, currency)}{" "}
              (rango {formatCurrency(estimate.range.min, currency)} –{" "}
              {formatCurrency(estimate.range.max, currency)}), basado en{" "}
              {formatCurrency(estimate.avgPricePerM2, currency)} / m² de promedio.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {estimate.comparablesCount} comparable(s) en el área y del mismo tipo
              {estimate.level === "ciudad-sin-area"
                ? " (sin limitar área)"
                : estimate.level === "ciudad"
                ? " (ampliado a la ciudad, cualquier tipo)"
                : estimate.level?.includes("parcial")
                ? " (pocos datos)"
                : ""}
              .
            </p>
          </div>
        </div>
      )}

      {canEdit && (
        <form
          className="mt-4 rounded-lg border border-dashed border-gray-300 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const value = Number(marketValue);
            if (!marketValue || !(value > 0)) return;
            registerValuation.mutate({
              propertyId,
              marketValue: value,
              source: source as "INSPECTION",
              notes: notes || undefined,
              valuedAt: valuedAt || undefined,
            });
          }}
        >
          <p className="mb-3 text-sm font-semibold text-gray-900">
            Registrar nueva valoración
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={marketValue}
              onChange={(e) => setMarketValue(e.target.value)}
              placeholder={`Valor de mercado (${currency})`}
              className="rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:col-span-2"
            />
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-lg border bg-gray-50 px-2 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              {Object.entries(SOURCE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={valuedAt}
              onChange={(e) => setValuedAt(e.target.value)}
              className="rounded-lg border bg-gray-50 px-2 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nota (opcional)"
              className="rounded-lg border bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:col-span-3"
            />
            <button
              type="submit"
              disabled={registerValuation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {registerValuation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {valuations && valuations.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-gray-900">Historial</p>
          {valuations.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {formatCurrency(v.marketValue, v.currency)}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {SOURCE_LABELS[v.source]}
                  </span>
                </p>
                <p className="truncate text-xs text-gray-500">
                  {v.userName || "—"} · {formatDate(v.valuedAt)}
                  {v.notes ? ` · ${v.notes}` : ""}
                </p>
              </div>
              {(canEdit || user?.id === v.userId) && (
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar esta valoración?")) {
                      deleteValuation.mutate({ id: v.id });
                    }
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 h-16 animate-pulse rounded-lg bg-gray-100" />
      )}
    </div>
  );
}