"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { generatePropertyDescription } from "@/lib/propertyDescription";
import { ArrowLeft, Save, Sparkles } from "lucide-react";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: property, isLoading } = trpc.property.getById.useQuery({
    id: params.id as string,
  });

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
    yearBuilt: "",
    parking: "",
    floors: "",
    videoUrl: "",
    contactName: "",
    contactPhone: "",
    featuredText1: "",
    featuredText2: "",
  });

  const [loaded, setLoaded] = useState(false);

  if (property && !loaded) {
    setForm({
      title: property.title,
      description: property.description || "",
      price: String(property.price),
      currency: property.currency,
      address: property.address,
      city: property.city,
      district: property.district || "",
      state: property.state || "",
      country: property.country,
      bedrooms: property.bedrooms ? String(property.bedrooms) : "",
      bathrooms: property.bathrooms ? String(property.bathrooms) : "",
      area: property.area ? String(property.area) : "",
      type: property.type,
      yearBuilt: property.yearBuilt ? String(property.yearBuilt) : "",
      parking: property.parking ? String(property.parking) : "",
      floors: property.floors ? String(property.floors) : "",
      videoUrl: property.videoUrl || "",
      contactName: property.contactName || "",
      contactPhone: property.contactPhone || "",
      featuredText1: property.featuredText1 || "",
      featuredText2: property.featuredText2 || "",
    });
    setLoaded(true);
  }

  const updateProperty = trpc.property.update.useMutation({
    onSuccess: () => {
      utils.property.list.invalidate();
      router.push(`/properties/${params.id}`);
    },
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
    updateProperty.mutate({
      id: params.id as string,
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
  };

  if (isLoading) return <div className="animate-pulse h-96 rounded-xl bg-gray-200" />;
  if (!property) return <p className="text-gray-500">Propiedad no encontrada</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/properties/${params.id}`} className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Propiedad</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" required />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Generar descripción
                </button>
              </div>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={8} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Moneda</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none">
                <option value="PEN">Soles</option>
                <option value="USD">Dólares</option>
                <option value="EUR">Euros</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Dirección</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ciudad</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Distrito</label>
              <input type="text" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Habitaciones</label>
              <input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Baños</label>
              <input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Área (m²)</label>
              <input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none">
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
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Descripción publicable</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Texto libre 1 (L5)</label>
              <textarea value={form.featuredText1} onChange={(e) => setForm({ ...form, featuredText1: e.target.value })} rows={2} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Texto libre 2 (L6)</label>
              <textarea value={form.featuredText2} onChange={(e) => setForm({ ...form, featuredText2: e.target.value })} rows={2} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Video (URL)</label>
              <input type="url" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
              <p className="mt-1 text-xs text-gray-500">Si no hay video, la publicación usará un carrusel con las fotos.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Contacto de publicación</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre de contacto (L8)</label>
              <input type="text" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono de contacto (L9)</label>
              <input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href={`/properties/${params.id}`} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancelar
          </Link>
          <button type="submit" disabled={updateProperty.isPending} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            <Save className="h-4 w-4" />
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
