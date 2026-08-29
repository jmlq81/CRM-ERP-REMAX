"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

type InteresadoSource =
  | "WEB"
  | "PHONE"
  | "EMAIL"
  | "REFERRAL"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "WHATSAPP"
  | "OTHER";

export default function NewInteresadoPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: properties } = trpc.property.list.useQuery({});
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    source: InteresadoSource;
    notes: string;
    budget: string;
    propertyId: string;
    interestLevel: string;
  }>({
    name: "",
    email: "",
    phone: "",
    source: "WEB",
    notes: "",
    budget: "",
    propertyId: "",
    interestLevel: "",
  });

  const createInteresado = trpc.interesado.create.useMutation({
    onSuccess: () => {
      utils.interesado.list.invalidate();
      router.push("/interesados");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInteresado.mutate({
      name: form.name,
      email: form.email,
      phone: form.phone,
      source: form.source,
      notes: form.notes,
      budget: form.budget ? Number(form.budget) : undefined,
      propertyId: form.propertyId || undefined,
      interestLevel: form.interestLevel
        ? Number(form.interestLevel)
        : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/interesados" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Interesado</h1>
          <p className="text-gray-600">Agrega un nuevo interesado a tu CRM</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Información del Contacto
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Nombre *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fuente
              </label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as InteresadoSource })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="WEB">Sitio Web</option>
                <option value="PHONE">Teléfono</option>
                <option value="EMAIL">Email</option>
                <option value="REFERRAL">Referido</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Presupuesto
              </label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Propiedad de interés
              </label>
              <select
                value={form.propertyId}
                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="">Seleccionar propiedad</option>
                {properties?.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} - {p.city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nivel de interés (1-5)
              </label>
              <select
                value={form.interestLevel}
                onChange={(e) => setForm({ ...form, interestLevel: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="">Sin asignar</option>
                <option value="1">1 - Muy bajo</option>
                <option value="2">2 - Bajo</option>
                <option value="3">3 - Medio</option>
                <option value="4">4 - Alto</option>
                <option value="5">5 - Muy alto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notas
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/interesados"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createInteresado.isPending}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {createInteresado.isPending ? "Guardando..." : "Guardar Interesado"}
          </button>
        </div>
      </form>
    </div>
  );
}
