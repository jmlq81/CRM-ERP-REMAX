"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  Plus, Search, Filter, MapPin, BedDouble, Bath, Maximize, Home
} from "lucide-react";

function PropertiesContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");

  const { data, isLoading } = trpc.property.list.useQuery({
    search: search || undefined,
    status: status || undefined,
    city: city || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
          <p className="text-gray-600">Gestiona tu portafolio de propiedades</p>
        </div>
        <Link
          href="/properties/new"
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Propiedad
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, dirección..."
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
          <option value="ACTIVE">Activo</option>
          <option value="SOLD">Vendido</option>
          <option value="RENTED">Alquilado</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
        >
          <option value="">Todas las ciudades</option>
          <option value="Lima">Lima</option>
          <option value="Arequipa">Arequipa</option>
          <option value="Trujillo">Trujillo</option>
          <option value="Cusco">Cusco</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white p-4 shadow-sm">
              <div className="h-48 rounded-lg bg-gray-200" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.properties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 bg-gray-200">
                {property.photos[0] ? (
                  <img
                    src={property.photos[0].url}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    Sin imagen
                  </div>
                )}
                <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow">
                  {property.type}
                </span>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600">
                  {property.title}
                </h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {property.city}, {property.address}
                </p>

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                  {property.bedrooms && (
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-4 w-4" />
                      {property.bedrooms}
                    </span>
                  )}
                  {property.bathrooms && (
                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms}
                    </span>
                  )}
                  {property.area && (
                    <span className="flex items-center gap-1">
                      <Maximize className="h-4 w-4" />
                      {property.area}m²
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(Number(property.price), property.currency)}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
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
            </Link>
          ))}
        </div>
      )}

      {data?.properties.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-950/5">
          <Home className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No hay propiedades
          </h3>
          <p className="mt-2 text-gray-500">
            Comienza agregando tu primera propiedad
          </p>
          <Link
            href="/properties/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Nueva Propiedad
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 rounded-xl bg-gray-200" />}>
      <PropertiesContent />
    </Suspense>
  );
}
