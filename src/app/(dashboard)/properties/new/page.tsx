"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { generatePropertyDescription } from "@/lib/propertyDescription";
import { ArrowLeft, Save, Upload, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NewPropertyPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "PEN",
    address: "",
    city: "",
    district: "",
    state: "",
    country: "Peru",
    bedrooms: "",
    bathrooms: "",
    area: "",
    type: "HOUSE",
    features: [] as string[],
    yearBuilt: "",
    parking: "",
    floors: "",
    videoUrl: "",
    contactName: "",
    contactPhone: "",
    featuredText1: "",
    featuredText2: "",
  });

  const createProperty = trpc.property.create.useMutation({
    onSuccess: () => {
      utils.property.list.invalidate();
      router.push("/properties");
    },
  });

  const buildInput = () => ({
    ...(form as any),
    price: Number(form.price),
    bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
    area: form.area ? Number(form.area) : undefined,
    yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
    parking: form.parking ? Number(form.parking) : undefined,
    floors: form.floors ? Number(form.floors) : undefined,
    videoUrl: form.videoUrl || undefined,
    contactName: form.contactName || undefined,
    contactPhone: form.contactPhone || undefined,
    featuredText1: form.featuredText1 || undefined,
    featuredText2: form.featuredText2 || undefined,
  });

  const handleGenerateDescription = () => {
    const desc = generatePropertyDescription({
      type: form.type,
      price: Number(form.price) || 0,
      currency: form.currency,
      city: form.city,
      district: form.district,
      area: form.area ? Number(form.area) : undefined,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      featuredText1: form.featuredText1,
      featuredText2: form.featuredText2,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
    });
    setForm({ ...form, description: desc });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProperty.mutate(buildInput());
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/properties"
          className="rounded-lg p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Propiedad</h1>
          <p className="text-gray-600">Agrega una nueva propiedad a tu portafolio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Información Básica
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Generar descripción
                </button>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={8}
                placeholder="Plantilla: 1) tipo + precio + lugar, 2) m², 3) habitaciones, 4) baños, 5-6) texto libre, 7) precio, 8) nombre, 9) teléfono, 10) REMAX FAMILY"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Precio *
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Moneda
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
                <option value="EUR">Euros (EUR)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="HOUSE">Casa</option>
                <option value="APARTMENT">Departamento</option>
                <option value="CONDO">Condominio</option>
                <option value="LAND">Terreno</option>
                <option value="OFFICE">Oficina</option>
                <option value="WAREHOUSE">Almacén</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Ubicación</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Dirección *
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ciudad *
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Distrito
              </label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Departamento/Estado
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                País
              </label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Características
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Habitaciones
              </label>
              <input
                type="number"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Baños
              </label>
              <input
                type="number"
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Área (m²)
              </label>
              <input
                type="number"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estacionamientos
              </label>
              <input
                type="number"
                value={form.parking}
                onChange={(e) => setForm({ ...form, parking: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Año de construcción
              </label>
              <input
                type="number"
                value={form.yearBuilt}
                onChange={(e) => setForm({ ...form, yearBuilt: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pisos
              </label>
              <input
                type="number"
                value={form.floors}
                onChange={(e) => setForm({ ...form, floors: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Descripción publicable
          </h2>
          <p className="mb-4 text-sm text-gray-500">
            Los textos libres (L5 y L6) se insertan en la descripción generada.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Texto libre 1 (L5) - características destacadas
              </label>
              <textarea
                value={form.featuredText1}
                onChange={(e) => setForm({ ...form, featuredText1: e.target.value })}
                rows={2}
                placeholder="Ej: Sala comedor amplia, cocina equipada, vista panorámica"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Texto libre 2 (L6) - entorno / plus
              </label>
              <textarea
                value={form.featuredText2}
                onChange={(e) => setForm({ ...form, featuredText2: e.target.value })}
                rows={2}
                placeholder="Ej: A 5 min de plaza principal, cerca de colegios y centros comerciales"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Video (URL de YouTube/Facebook)
              </label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Si no hay video, la publicación usará un carrusel con las fotos.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Contacto de publicación
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre de contacto (L8)
              </label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono de contacto (L9)
              </label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/properties"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createProperty.isPending}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {createProperty.isPending ? "Guardando..." : "Guardar Propiedad"}
          </button>
        </div>
      </form>
    </div>
  );
}
