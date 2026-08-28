"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

interface Participant {
  userId: string;
  role: "PRIMARY" | "CO_BROKER" | "REFERRAL";
  sharePct: string;
}

export default function NewDealPage() {
  const router = useRouter();
  const { data: properties, isLoading: loadingProps } = trpc.property.list.useQuery({});
  const { data: leads } = trpc.lead.list.useQuery({});
  const { data: agents } = trpc.agent.listSimple.useQuery();
  const { data: me } = trpc.user.me.useQuery();

  const [form, setForm] = useState({
    title: "",
    propertyId: "",
    leadId: "",
    salePrice: "",
    commissionPct: "3",
    notes: "",
  });

  const [participants, setParticipants] = useState<Participant[]>([]);

  const createDeal = trpc.deal.create.useMutation({
    onSuccess: (deal) => {
      router.push(`/deals/${deal.id}`);
    },
    onError: (err) => alert(err.message),
  });

  const availableAgents = agents?.filter((a) => a.id !== me?.id) ?? [];

  const addParticipant = () => {
    setParticipants((prev) => [
      ...prev,
      { userId: "", role: "CO_BROKER", sharePct: "" },
    ]);
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const removeParticipant = (index: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.propertyId) return;

    const shares = participants
      .filter((p) => p.userId && p.sharePct)
      .map((p) => Number(p.sharePct));
    if (shares.length > 0) {
      const total = shares.reduce((sum, s) => sum + s, 0);
      if (total > 100) {
        alert("La suma de los porcentajes no puede superar 100%");
        return;
      }
    }

    createDeal.mutate({
      title: form.title.trim(),
      propertyId: form.propertyId,
      leadId: form.leadId || undefined,
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      commissionPct: form.commissionPct ? Number(form.commissionPct) : undefined,
      notes: form.notes || undefined,
      participants: participants
        .filter((p) => p.userId)
        .map((p) => ({
          userId: p.userId,
          role: p.role,
          sharePct: p.sharePct ? Number(p.sharePct) : undefined,
        })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/deals"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Operación</h1>
          <p className="text-gray-600">
            Crea una operación compartida con co-brokers
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Título de la operación *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ej: Venta departamento Miraflores"
            className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Propiedad *
            </label>
            <select
              value={form.propertyId}
              onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
              required
            >
              <option value="">
                {loadingProps ? "Cargando..." : "Selecciona una propiedad"}
              </option>
              {properties?.properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cliente (lead)
            </label>
            <select
              value={form.leadId}
              onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
            >
              <option value="">Sin cliente asociado</option>
              {leads?.leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Precio de venta (S/ o USD)
            </label>
            <input
              type="number"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              placeholder="Opcional (usa el precio de la propiedad)"
              className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Comisión (%) *
            </label>
            <input
              type="number"
              value={form.commissionPct}
              onChange={(e) => setForm({ ...form, commissionPct: e.target.value })}
              min="0"
              max="100"
              step="0.1"
              className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Notas
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Co-brokers (operación compartida)
            </label>
            <button
              type="button"
              onClick={addParticipant}
              className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>

          {participants.length === 0 && (
            <p className="text-sm text-gray-500">
              Sin co-brokers. La comisión será 100% tuya.
            </p>
          )}

          <div className="space-y-3">
            {participants.map((p, index) => (
              <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
                <select
                  value={p.userId}
                  onChange={(e) => updateParticipant(index, "userId", e.target.value)}
                  className="flex-1 rounded-lg border bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                >
                  <option value="">Selecciona un agente</option>
                  {availableAgents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <select
                  value={p.role}
                  onChange={(e) => updateParticipant(index, "role", e.target.value)}
                  className="rounded-lg border bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                >
                  <option value="CO_BROKER">Co-broker</option>
                  <option value="REFERRAL">Referido</option>
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={p.sharePct}
                    onChange={(e) => updateParticipant(index, "sharePct", e.target.value)}
                    placeholder="% comisión"
                    min="0"
                    max="100"
                    className="w-28 rounded-lg border bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {participants.some((p) => p.sharePct) && (
            <p className="mt-2 text-xs text-gray-500">
              El agente principal recibe el resto automáticamente. Si no pones
              porcentajes, la comisión se divide equitativamente.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/deals"
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createDeal.isPending}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {createDeal.isPending ? "Guardando..." : "Crear Operación"}
          </button>
        </div>
      </form>
    </div>
  );
}