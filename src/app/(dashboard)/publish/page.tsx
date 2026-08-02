"use client";

import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { Globe, MessageCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import ConnectFacebook from "@/components/ConnectFacebook";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

interface ConnectedAccount {
  id: string;
  pageId: string;
  pageName: string;
  tokenExpiresAt: string | null;
}

export default function PublishPage() {
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const { data: properties } = trpc.property.list.useQuery({});

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook/accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      setAccounts([]);
    }
    setLoadingAccounts(false);
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handlePublish = async () => {
    if (!selectedProperty || !selectedAccount) return;
    setPublishing(true);
    setResult(null);

    try {
      const res = await fetch("/api/publish/facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedProperty,
          facebookAccountId: selectedAccount,
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
        <p className="text-gray-600">Publica tus propiedades en Facebook</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FacebookIcon className="h-5 w-5 text-blue-600" />
            Páginas conectadas
          </h2>
          <ConnectFacebook accounts={accounts} onAccountsChange={loadAccounts} />
        </div>

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
                Página de Facebook
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                disabled={loadingAccounts || accounts.length === 0}
                className="mt-1 block w-full rounded-lg border px-4 py-2 focus:border-red-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {loadingAccounts ? "Cargando..." : accounts.length === 0 ? "Primero conecta tu página" : "Seleccionar página"}
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.pageName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePublish}
              disabled={publishing || !selectedProperty || !selectedAccount}
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
      </div>
    </div>
  );
}
