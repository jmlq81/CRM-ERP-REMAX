"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  Coins,
  Handshake,
  RefreshCcw,
  Trash2,
  UserPlus,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  OPEN: "Abierta",
  NEGOTIATION: "En negociación",
  CLOSED_WON: "Ganada",
  CLOSED_LOST: "Perdida",
  CANCELLED: "Cancelada",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  NEGOTIATION: "bg-yellow-100 text-yellow-700",
  CLOSED_WON: "bg-green-100 text-green-700",
  CLOSED_LOST: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

const roleLabels: Record<string, string> = {
  PRIMARY: "Principal",
  CO_BROKER: "Co-broker",
  REFERRAL: "Referido",
};

const commissionStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();

  const { data: deal, isLoading } = trpc.deal.getById.useQuery({ id });
  const { data: agents } = trpc.agent.listSimple.useQuery();
  const closeDeal = trpc.deal.closeDeal.useMutation();
  const reopenDeal = trpc.deal.reopenDeal.useMutation();
  const updateStatus = trpc.deal.update.useMutation();
  const addParticipant = trpc.deal.addParticipant.useMutation();
  const removeParticipant = trpc.deal.removeParticipant.useMutation();
  const updateCommission = trpc.deal.updateCommissionStatus.useMutation();

  const [salePrice, setSalePrice] = useState("");
  const [commissionPct, setCommissionPct] = useState("");
  const [newParticipant, setNewParticipant] = useState("");

  const currentUser = trpc.user.me.useQuery();

  const refresh = () => {
    utils.deal.getById.invalidate({ id });
    utils.deal.list.invalidate();
  };

  if (isLoading) {
    return <div className="animate-pulse h-96 rounded-xl bg-gray-200" />;
  }

  if (!deal) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">Operación no encontrada</p>
        <Link href="/deals" className="mt-4 inline-block text-sm text-red-600">
          Volver a operaciones
        </Link>
      </div>
    );
  }

  const handleUpdateStatus = (status: "OPEN" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST" | "CANCELLED") => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: refresh,
        onError: (e) => alert(e.message),
      }
    );
  };

  const handleClose = () => {
    closeDeal.mutate(
      {
        id,
        salePrice: salePrice ? Number(salePrice) : undefined,
        commissionPct: commissionPct ? Number(commissionPct) : undefined,
      },
      { onSuccess: refresh, onError: (e) => alert(e.message) }
    );
  };

  const handleAddParticipant = () => {
    if (!newParticipant) return;
    addParticipant.mutate(
      { dealId: id, participant: { userId: newParticipant, role: "CO_BROKER" } },
      { onSuccess: () => { setNewParticipant(""); refresh(); }, onError: (e) => alert(e.message) }
    );
  };

  const handleRemoveParticipant = (userId: string) => {
    if (!confirm("¿Quitar este participante?")) return;
    removeParticipant.mutate(
      { dealId: id, userId },
      { onSuccess: refresh, onError: (e) => alert(e.message) }
    );
  };

  const handleCommissionStatus = (commissionId: string, status: "PENDING" | "PAID" | "CANCELLED") => {
    updateCommission.mutate(
      { commissionId, status },
      { onSuccess: refresh, onError: (e) => alert(e.message) }
    );
  };

  const canManage = deal.participants.some((p) => p.userId === currentUser.data?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/deals" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[deal.status]}`}>
          {statusLabels[deal.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Información</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Propiedad</p>
                <Link href={`/properties/${deal.propertyId}`} className="font-medium text-gray-900 hover:underline">
                  {deal.property.title}
                </Link>
                <p className="text-sm text-gray-500">
                  {formatCurrency(Number(deal.property.price), deal.property.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium text-gray-900">{deal.interesado?.name || "Sin cliente"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Agente principal</p>
                <p className="font-medium text-gray-900">{deal.createdBy.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Comisión</p>
                <p className="font-medium text-gray-900">
                  {deal.commissionPct != null ? `${deal.commissionPct}%` : "Por definir"}
                </p>
              </div>
            </div>
            {deal.notes && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{deal.notes}</div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Estado de la operación</h2>
            {deal.status !== "CLOSED_WON" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus("OPEN")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-blue-50"
                  >
                    Abierta
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("NEGOTIATION")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-yellow-50"
                  >
                    En negociación
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("CLOSED_LOST")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-red-50"
                  >
                    Perdida
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("CANCELLED")}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    Cancelada
                  </button>
                </div>

                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <h3 className="flex items-center gap-2 font-semibold text-green-800">
                    <Coins className="h-4 w-4" />
                    Cerrar y generar comisiones
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder={`Precio de venta (${formatCurrency(Number(deal.property.price), deal.property.currency)})`}
                      className="rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={commissionPct}
                      onChange={(e) => setCommissionPct(e.target.value)}
                      placeholder="% comisión"
                      min="0"
                      step="0.1"
                      className="rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={closeDeal.isPending}
                    className="mt-3 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {closeDeal.isPending ? "Generando..." : "Cerrar operación ganada"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                <div>
                  <p className="font-semibold text-green-800">Operación ganada</p>
                  {deal.totalCommission !== null && deal.totalCommission !== undefined && (
                    <p className="text-sm text-green-700">
                      Comisión total: {formatCurrency(Number(deal.totalCommission), deal.property.currency)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm("¿Reabrir la operación? Se eliminarán las comisiones generadas.")) {
                      reopenDeal.mutate({ id }, { onSuccess: refresh, onError: (e) => alert(e.message) });
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg border border-green-600 px-3 py-2 text-sm text-green-700 hover:bg-green-100"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reabrir
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Comisiones</h2>
            {deal.commissions.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no hay comisiones. Cierra la operación como ganada para generarlas automáticamente.
              </p>
            ) : (
              <div className="space-y-3">
                {deal.commissions.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {c.user.image ? (
                        <img src={c.user.image} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                          {c.user.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{c.user.name}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(Number(c.amount), c.currency)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          c.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : c.status === "CANCELLED"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {commissionStatusLabels[c.status]}
                      </span>
                      {deal.status === "CLOSED_WON" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCommissionStatus(c.id, "PAID")}
                            className="rounded-md bg-green-100 p-1.5 text-green-700 hover:bg-green-200"
                            title="Marcar pagada"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCommissionStatus(c.id, "CANCELLED")}
                            className="rounded-md bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
                            title="Cancelar comisión"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Participantes</h2>
            <div className="space-y-3">
              {deal.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    {p.user.image ? (
                      <img src={p.user.image} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                        {p.user.name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{p.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {roleLabels[p.role]} {p.sharePct ? `· ${p.sharePct}% de comisión` : ""}
                      </p>
                    </div>
                  </div>
                  {canManage && p.user.id !== deal.createdById && (
                    <button
                      onClick={() => handleRemoveParticipant(p.user.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Quitar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {canManage && deal.status !== "CLOSED_WON" && (
              <div className="mt-4 flex gap-2">
                <select
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                >
                  <option value="">Agregar co-broker...</option>
                  {agents
                    ?.filter((a) => !deal.participants.some((p) => p.userId === a.id))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddParticipant}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <Link
            href={`/properties/${deal.propertyId}`}
            className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 hover:shadow-md"
          >
            <Handshake className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-gray-700">Ver propiedad</span>
          </Link>
        </div>
      </div>
    </div>
  );
}