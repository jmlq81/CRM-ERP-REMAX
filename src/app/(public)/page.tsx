"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { MapPin, BedDouble, Bath, Maximize, Search, Home } from "lucide-react";
import Link from "next/link";

export default function PublicPage() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");

  const { data } = trpc.property.list.useQuery({
    search: search || undefined,
    city: city || undefined,
    type: type || undefined,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          Encuentra tu propiedad ideal
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Las mejores propiedades con el respaldo de RE/MAX
        </p>
      </div>

      <div className="mb-8 flex gap-4 rounded-xl bg-gray-50 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar propiedades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 text-sm"
          />
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-lg border bg-white px-4 py-2 text-sm"
        >
          <option value="">Todas las ciudades</option>
          <option value="Lima">Lima</option>
          <option value="Arequipa">Arequipa</option>
          <option value="Trujillo">Trujillo</option>
          <option value="Cusco">Cusco</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border bg-white px-4 py-2 text-sm"
        >
          <option value="">Todos los tipos</option>
          <option value="HOUSE">Casa</option>
          <option value="APARTMENT">Departamento</option>
          <option value="CONDO">Condominio</option>
          <option value="LAND">Terreno</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.properties.map((property) => (
          <div
            key={property.id}
            className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
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
                  <Home className="h-12 w-12" />
                </div>
              )}
              <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-semibold shadow">
                {property.type}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {property.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-3 w-3" />
                {property.city}, {property.district || property.address}
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                {property.bedrooms && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-4 w-4" /> {property.bedrooms}
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" /> {property.bathrooms}
                  </span>
                )}
                {property.area && (
                  <span className="flex items-center gap-1">
                    <Maximize className="h-4 w-4" /> {property.area}m²
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(Number(property.price), property.currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
