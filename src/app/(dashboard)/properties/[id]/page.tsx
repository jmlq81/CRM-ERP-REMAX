"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Calendar,
  Edit,
  Trash2,
  Share2,
  Upload,
  Handshake,
  X,
} from "lucide-react";
import { useState } from "react";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [uploading, setUploading] = useState(false);

  const { data: property, isLoading } = trpc.property.getById.useQuery({
    id: params.id as string,
  });

  const deleteProperty = trpc.property.delete.useMutation({
    onSuccess: () => {
      utils.property.list.invalidate();
      router.push("/properties");
    },
  });

  const deletePhoto = trpc.property.deletePhoto.useMutation({
    onSuccess: () => {
      utils.property.getById.invalidate({ id: property?.id ?? (params.id as string) });
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-96 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Propiedad no encontrada</p>
        <Link href="/properties" className="text-red-600 hover:underline">
          Volver a propiedades
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/properties" className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
            <p className="flex items-center gap-1 text-gray-500">
              <MapPin className="h-4 w-4" />
              {property.city}, {property.address}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/deals/new?propertyId=${property.id}`}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Handshake className="h-4 w-4" />
            Nueva Operación
          </Link>
          <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Share2 className="h-4 w-4" />
            Compartir
          </button>
          <Link
            href={`/properties/${property.id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Link>
          <button
            onClick={() => {
              if (confirm("¿Estás seguro de eliminar esta propiedad?")) {
                deleteProperty.mutate({ id: property.id });
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {property.photos.length < 3 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
              Agrega al menos 3 fotos (máximo 10) para poder publicar en Facebook.{" "}
              {property.photos.length}/3 completadas.
            </div>
          )}
          {property.videoUrl && (
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
              <a
                href={property.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-semibold text-red-600 hover:underline"
              >
                Ver video de la propiedad
              </a>
            </div>
          )}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            {property.photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {property.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={photo.alt || property.title}
                    className="h-48 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                Sin fotos
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Descripción</h2>
            <p className="whitespace-pre-wrap text-gray-600">
              {property.description || "Sin descripción"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Fotos</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {property.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.alt || property.title}
                    className="h-32 w-full rounded-lg object-cover"
                  />
                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar esta foto?")) {
                        deletePhoto.mutate({
                          photoId: photo.id,
                          propertyId: property.id,
                        });
                      }
                    }}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    title="Eliminar foto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {property.photos.length < 10 ? (
                <label className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-red-500">
                  <div className="text-center">
                    <Upload className="mx-auto h-6 w-6 text-gray-400" />
                    <span className="mt-1 block text-xs text-gray-500">
                      {uploading ? "Subiendo..." : "Agregar foto"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("propertyId", property.id);
                      await fetch("/api/upload", { method: "POST", body: formData });
                      utils.property.getById.invalidate({ id: property.id });
                      setUploading(false);
                    }}
                  />
                </label>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-center text-xs text-gray-400">
                  Máximo 10 fotos
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Características
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {property.bedrooms && (
                <div className="flex items-center gap-2 text-gray-600">
                  <BedDouble className="h-5 w-5" />
                  <span>{property.bedrooms} Habitaciones</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Bath className="h-5 w-5" />
                  <span>{property.bathrooms} Baños</span>
                </div>
              )}
              {property.area && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Maximize className="h-5 w-5" />
                  <span>{property.area} m²</span>
                </div>
              )}
              {property.yearBuilt && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <span>{property.yearBuilt}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <p className="text-sm text-gray-500">Precio</p>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(Number(property.price), property.currency)}
            </p>
            <div className="mt-4">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  property.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : property.status === "SOLD"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {property.status}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Interesados en esta propiedad
            </h3>
            {property.interesados.length > 0 ? (
              <div className="space-y-2">
                {property.interesados.map((interesado) => (
                  <Link
                    key={interesado.id}
                    href={`/interesados/${interesado.id}`}
                    className="block rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <p className="font-medium text-gray-900">{interesado.name}</p>
                    <p className="text-sm text-gray-500">{interesado.email}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay interesados registrados</p>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Operaciones
            </h3>
            {property.deals.length > 0 ? (
              <div className="space-y-2">
                {property.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="block rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{deal.title}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                          deal.status === "OPEN"
                            ? "bg-blue-100 text-blue-700"
                            : deal.status === "NEGOTIATION"
                            ? "bg-amber-100 text-amber-700"
                            : deal.status === "CLOSED_WON"
                            ? "bg-green-100 text-green-700"
                            : deal.status === "CLOSED_LOST"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {deal.status === "OPEN"
                          ? "Abierta"
                          : deal.status === "NEGOTIATION"
                          ? "En negociación"
                          : deal.status === "CLOSED_WON"
                          ? "Ganada"
                          : deal.status === "CLOSED_LOST"
                          ? "Perdida"
                          : "Cancelada"}
                      </span>
                    </div>
                    {deal.participants.length > 0 && (
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {deal.participants.map((p) => p.user.name).join(", ")}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No hay operaciones. Crea una con el botón {"\u201CNueva Operación\u201D"}.
              </p>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Publicaciones
            </h3>
            {property.publications.length > 0 ? (
              <div className="space-y-2">
                {property.publications.map((pub) => (
                  <div key={pub.id} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium">{pub.platform}</span>
                    <span
                      className={`text-xs ${
                        pub.status === "PUBLISHED"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {pub.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay publicaciones</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
