"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { Globe, MessageCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PublishPage() {
  const [pageId, setPageId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: properties } = trpc.property.list.useQuery({});

  const handlePublish = async () => {
    if (!selectedProperty || !pageId || !accessToken) return;
    setPublishing(true);
    setResult(null);

    try {
      const res = await fetch("/api/publish/facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedProperty,
          pageId,
          accessToken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: "Publicado en Facebook correctamente" });
      } else {
        setResult({ success: false, message: data.error || "Error al publicar" });
      }
    } catch {
      setResult({ success: false, message: "Error de conexión" });
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publicar</h1>
        <p className="text-gray-600">Publica tus propiedades en Facebook Marketplace</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Publicar en Facebook
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Propiedad
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="">Seleccionar propiedad</option>
                {properties?.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} - {formatCurrency(Number(p.price), p.currency)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Facebook Page ID
              </label>
              <input
                type="text"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="Ej: 123456789012345"
                className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Lo encuentras en tu página de Facebook → Acerca de → ID de la página
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Token de Acceso
              </label>
              <input
                type="text"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAD..."
                className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ve al{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  className="text-red-600 hover:underline"
                >
                  Graph API Explorer
                </a>
                , selecciona tu app y genera un token con permiso pages_manage_posts
              </p>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing || !selectedProperty || !pageId || !accessToken}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  Publicar en Facebook
                </>
              )}
            </button>

            {result && (
              <div
                className={`rounded-lg p-4 ${
                  result.success
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <p className="text-sm font-medium">{result.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Historial de Publicaciones
          </h2>
          <p className="text-sm text-gray-500">
            Acá verás el historial de propiedades publicadas
          </p>
        </div>
      </div>
    </div>
  );
}
