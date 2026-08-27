"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { Plus, Handshake, MapPin, Coins } from "lucide-react";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  NEGOTIATION: "bg-yellow-100 text-yellow-700",
  CLOSED_WON: "bg-green-100 text-green-700",
  CLOSED_LOST: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  OPEN: "Abierta",
  NEGOTIATION: "En negociación",
  CLOSED_WON: "Ganada",
  CLOSED_LOST: "Perdida",
  CANCELLED: "Cancelada",
};

const roleLabels: Record<string, string> = {
  PRIMARY: "Principal",
  CO_BROKER: "Co-broker",
  REFERRAL: "Refiere",
};

export default function DealsPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading } = trpc.deal.list.useQuery({
    status: status || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operaciones</h1>
          <p className="text-gray-600">
            Negociaciones compartidas, co-brokers y comisiones
          </p>
        </div>
        <Link
          href="/deals/new"
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Operación
        </Link>
      </div>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
      >
        <option value="">Todas las operaciones</option>
        <option value="OPEN">Abierta</option>
        <option value="NEGOTIATION">En negociación</option>
        <option value="CLOSED_WON">Ganada</option>
        <option value="CLOSED_LOST">Perdida</option>
        <option value="CANCELLED">Cancelada</option>
      </select>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white p-4 shadow-sm">
              <div className="h-6 w-1/3 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/4 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {deal.property.title}
                    </span>
                    {deal.lead && <span>{deal.lead.name}</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    {deal.participants.map((p) => (
                      <span key={p.userId}>
                        {p.user.name} ({roleLabels[p.role] || p.role}
                        {p.sharePct ? ` · ${p.sharePct}%` : ""})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {deal.totalCommission !== null && deal.totalCommission !== undefined && (
                  <span className="flex items-center gap-1 text-sm font-medium text-green-700">
                    <Coins className="h-4 w-4" />
                    {formatCurrency(Number(deal.totalCommission), deal.property.currency)}
                  </span>
                )}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    statusColors[deal.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusLabels[deal.status] || deal.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data?.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-950/5">
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No hay operaciones
          </h3>
          <p className="mt-2 text-gray-500">
            Crea una operación para gestionar co-brokers y comisiones
          </p>
          <Link
            href="/deals/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Nueva Operación
          </Link>
        </div>
      )}
    </div>
  );
}