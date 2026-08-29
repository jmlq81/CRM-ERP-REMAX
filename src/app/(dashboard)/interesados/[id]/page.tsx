"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Phone, Mail, Plus, CalendarClock } from "lucide-react";
import { useState } from "react";

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
  CLOSED_WON: "Cerrado ganado",
  CLOSED_LOST: "Cerrado perdido",
};

export default function InteresadoDetailPage() {
  const params = useParams();
  const [newNote, setNewNote] = useState("");
  const utils = trpc.useUtils();

  const { data: interesado, isLoading } = trpc.interesado.getById.useQuery({
    id: params.id as string,
  });

  const updateStatus = trpc.interesado.update.useMutation({
    onSuccess: () => {
      utils.interesado.list.invalidate();
      utils.interesado.getById.invalidate({ id: interesado?.id ?? (params.id as string) });
    },
  });

  const scheduleFollowUp = trpc.interesado.scheduleFollowUp.useMutation({
    onSuccess: () => {
      utils.interesado.getById.invalidate({ id: interesado?.id ?? (params.id as string) });
    },
  });

  const clearFollowUp = trpc.interesado.clearFollowUp.useMutation({
    onSuccess: () => {
      utils.interesado.getById.invalidate({ id: interesado?.id ?? (params.id as string) });
    },
  });

  const addInteraction = trpc.interesado.addInteraction.useMutation({
    onSuccess: () => {
      utils.interesado.list.invalidate();
      setNewNote("");
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!interesado) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Interesado no encontrado</p>
        <Link href="/interesados" className="text-red-600 hover:underline">
          Volver a interesados
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/interesados" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
              {interesado.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{interesado.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {interesado.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {interesado.email}
                  </span>
                )}
                {interesado.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {interesado.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Historial de Interacciones
            </h2>
            <div className="space-y-4">
              {interesado.interactions.map((interaction) => (
                <div key={interaction.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {interaction.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(interaction.createdAt).toLocaleDateString("es-PE")}
                    </span>
                  </div>
                  {interaction.content && (
                    <p className="mt-2 text-sm text-gray-600">
                      {interaction.content}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar nota..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  onClick={() => {
                    if (newNote.trim()) {
                      addInteraction.mutate({
                        interesadoId: interesado.id,
                        type: "NOTE",
                        content: newNote,
                      });
                    }
                  }}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Estado</h3>
            <select
              value={interesado.status}
              onChange={(e) =>
                updateStatus.mutate({ id: interesado.id, status: e.target.value as "NEW" | "CONTACTED" | "QUALIFIED" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST" })
              }
              className="w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none"
            >
              <option value="NEW">Nuevo</option>
              <option value="CONTACTED">Contactado</option>
              <option value="QUALIFIED">Calificado</option>
              <option value="NEGOTIATION">Negociación</option>
              <option value="CLOSED_WON">Cerrado ganado</option>
              <option value="CLOSED_LOST">Cerrado perdido</option>
            </select>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Nivel de interés
            </h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    updateStatus.mutate({ id: interesado.id, interestLevel: n })
                  }
                  className={`h-8 w-8 rounded-full text-sm transition-colors ${
                    interesado.interestLevel && n <= interesado.interestLevel
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                  title={`Nivel ${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <CalendarClock className="h-5 w-5 text-gray-500" />
              Seguimiento
            </h3>
            {interesado.nextFollowUpAt ? (
              <p className="mb-3 text-sm text-gray-600">
                Próximo seguimiento:{" "}
                <span className="font-semibold">
                  {new Date(interesado.nextFollowUpAt).toLocaleDateString("es-PE", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </span>
              </p>
            ) : (
              <p className="mb-3 text-sm text-gray-500">
                Sin seguimiento programado
              </p>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => scheduleFollowUp.mutate({ interesadoId: interesado.id, days: 2 })}
                disabled={scheduleFollowUp.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Programar en 2 días
              </button>
              {interesado.nextFollowUpAt && (
                <button
                  onClick={() => clearFollowUp.mutate({ interesadoId: interesado.id })}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Completar seguimiento
                </button>
              )}
            </div>
          </div>

          {interesado.property && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Propiedad de interés
              </h3>
              <Link
                href={`/properties/${interesado.property.id}`}
                className="block rounded-lg border p-3 hover:bg-gray-50"
              >
                <p className="font-medium text-gray-900">{interesado.property.title}</p>
                <p className="text-sm text-gray-500">{interesado.property.city}</p>
              </Link>
            </div>
          )}

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Detalles</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Fuente</dt>
                <dd className="font-medium text-gray-900">{interesado.source}</dd>
              </div>
              {interesado.budget && (
                <div>
                  <dt className="text-sm text-gray-500">Presupuesto</dt>
                  <dd className="font-medium text-gray-900">
                    S/ {interesado.budget.toLocaleString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Creado</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(interesado.createdAt).toLocaleDateString("es-PE")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
