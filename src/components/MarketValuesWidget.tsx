"use client";

import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, MapPin } from "lucide-react";

function AvgCell({ value, currency }: { value: number | null; currency: string }) {
  if (value === null) return <span className="text-gray-300">—</span>;
  return (
    <span className="font-medium text-gray-900">
      {formatCurrency(value, currency)}/m²
    </span>
  );
}

export function MarketValuesWidget() {
  const { data: zones, isLoading } = trpc.property.marketZoneValues.useQuery();

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 h-32 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!zones || zones.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Valores de Referencia por Zona
          </h2>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Registra propiedades con precio, área y distrito para ver los valores
          promedio por zona.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-red-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Valores de Referencia por Zona
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 pr-4 font-medium text-gray-500">Zona</th>
              <th className="pb-2 px-2 text-right font-medium text-gray-500">
                Terreno
              </th>
              <th className="pb-2 px-2 text-right font-medium text-gray-500">
                Construcción
              </th>
              <th className="pb-2 px-2 text-right font-medium text-gray-500">
                Residencial
              </th>
              <th className="pb-2 px-2 text-right font-medium text-gray-500">
                Comercial
              </th>
              <th className="pb-2 pl-2 text-right font-medium text-gray-500">
                #props
              </th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr
                key={`${z.city}-${z.district}`}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{z.district}</p>
                      <p className="text-xs text-gray-500">{z.city}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <AvgCell value={z.terrenoM2} currency={z.currency} />
                </td>
                <td className="py-2.5 px-2 text-right">
                  <AvgCell value={z.construccionM2} currency={z.currency} />
                </td>
                <td className="py-2.5 px-2 text-right">
                  <AvgCell value={z.residencialM2} currency={z.currency} />
                </td>
                <td className="py-2.5 px-2 text-right">
                  <AvgCell value={z.comercialM2} currency={z.currency} />
                </td>
                <td className="py-2.5 pl-2 text-right text-xs text-gray-500">
                  {z.totalPropiedades}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Valores calculados con las propiedades registradas en la plataforma. Zonas
        definidas por distrito.
      </p>
    </div>
  );
}