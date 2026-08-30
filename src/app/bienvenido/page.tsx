"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TRPCProvider } from "@/lib/trpc-provider";
import { trpc } from "@/lib/trpc";
import { Home, Loader2, Building2, AlertCircle } from "lucide-react";

function BienvenidoContent() {
  const router = useRouter();
  const me = trpc.user.me.useQuery();
  const create = trpc.empresa.createForMe.useMutation();

  const [name, setName] = useState("");
  const [ruc, setRuc] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me.isLoading) return;
    if (me.data) {
      if (me.data.companyId) router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [me.data, me.isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({ name, ruc });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la empresa.");
    }
  };

  if (me.isLoading || !me.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-red-600 to-red-800 lg:flex">
        <div className="text-center text-white">
          <Home className="mx-auto mb-4 h-16 w-16" />
          <h1 className="text-4xl font-bold">RE/MAX CRM</h1>
          <p className="mt-2 text-red-100">Crea tu empresa y empieza a operar</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-white lg:w-1/2">
        <div className="w-full max-w-md space-y-6 p-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Bienvenido</h2>
            <p className="mt-2 text-gray-600">
              Vas a crear tu empresa. La creas tú con tu cuenta <span className="font-semibold">({me.data.email})</span> y te
              conviertes en el <span className="font-semibold">dueño</span>. Desde ahí podrás registrar agentes con su correo y
              contraseña; ellos no pueden crearse cuentas por sí solos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="rustic" value="true" />{" "}
            {/* trampa anti-bots */}
            {create.error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{create.error.message}</p>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre de la empresa
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Remax Centro Inmobiliario"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-3 transition-all placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                RUC (11 dígitos)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="20512345678"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-3 transition-all placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                Identificador tributario de Perú. Lo necesitarás para tu cotización de servicio.
              </p>
            </div>

            <button
              type="submit"
              disabled={create.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md active:translate-y-0 disabled:opacity-50"
            >
              {create.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Creando...
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5" /> Crear mi empresa
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400">
            Plan de ejemplo: 5 usuarios (agentes) y 30 propiedades. Estos topes son configurables según tu cotización de
            servicio por empresa.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BienvenidoPage() {
  return (
    <TRPCProvider>
      <BienvenidoContent />
    </TRPCProvider>
  );
}