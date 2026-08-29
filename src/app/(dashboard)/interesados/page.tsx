"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Phone, Mail, MessageSquare } from "lucide-react";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-green-100 text-green-700",
  NEGOTIATION: "bg-purple-100 text-purple-700",
  CLOSED_WON: "bg-green-100 text-green-700",
  CLOSED_LOST: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  NEGOTIATION: "Negociación",
  CLOSED_WON: "Cerrado",
  CLOSED_LOST: "Perdido",
};

function isOverdue(date: string): boolean {
  return new Date(date).setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0);
}

function FollowUpBadge({ date }: { date: string | null }) {
  if (!date) return null;
  const overdue = isOverdue(date);
  const label = new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
  });
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        overdue ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      {overdue ? `Seguimiento pendiente (${label})` : `Seg. ${label}`}
    </span>
  );
}

function InterestLevel({ level }: { level: number | null }) {
  if (!level) return null;
  return (
    <span className="text-xs text-gray-400" title={`Interés ${level}/5`}>
      {"●".repeat(level)}
      <span className="text-gray-200">{"●".repeat(5 - level)}</span>
    </span>
  );
}

export default function InteresadosPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = trpc.interesado.list.useQuery({
    search: search || undefined,
    status: status || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interesados</h1>
          <p className="text-gray-600">Gestiona tus contactos y prospectos</p>
        </div>
        <Link
          href="/interesados/new"
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Interesado
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="NEW">Nuevo</option>
          <option value="CONTACTED">Contactado</option>
          <option value="QUALIFIED">Calificado</option>
          <option value="NEGOTIATION">Negociación</option>
          <option value="CLOSED_WON">Cerrado ganado</option>
          <option value="CLOSED_LOST">Cerrado perdido</option>
        </select>
      </div>

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
          {data?.interesados.map((interesado) => (
            <Link
              key={interesado.id}
              href={`/interesados/${interesado.id}`}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <span className="text-lg font-semibold">
                    {interesado.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{interesado.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {interesado.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {interesado.email}
                      </span>
                    )}
                    {interesado.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {interesado.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {interesado.property && (
                  <span className="text-sm text-gray-500">
                    {interesado.property.title}
                  </span>
                )}
                <InterestLevel level={interesado.interestLevel} />
                <FollowUpBadge date={interesado.nextFollowUpAt as string | null} />
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    statusColors[interesado.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusLabels[interesado.status] || interesado.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data?.interesados.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-950/5">
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No hay interesados
          </h3>
          <p className="mt-2 text-gray-500">
            Comienza agregando tu primer interesado
          </p>
          <Link
            href="/interesados/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Interesado
          </Link>
        </div>
      )}
    </div>
  );
}
