"use client";

import { redirect } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home, Loader2 } from "lucide-react";

function RegisterContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    redirect("/login");
  }, []);

  return (
    <div className="flex w-full items-center justify-center bg-white lg:w-1/2">
      <div className="w-full max-w-md space-y-8 p-8 text-center">
        <Home className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">
          La creación de cuentas se realiza con Google
        </h2>
        <p className="text-gray-600">
          Utiliza tu cuenta de Google para registrarte en el CRM.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
        >
          Ir a Iniciar Sesión
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 items-center justify-center bg-gradient-to-br from-red-600 to-red-800 lg:flex">
        <div className="text-center text-white">
          <Home className="mx-auto mb-4 h-16 w-16" />
          <h1 className="text-4xl font-bold">RE/MAX CRM</h1>
          <p className="mt-2 text-red-100">Gestión inmobiliaria inteligente</p>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex w-1/2 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <RegisterContent />
      </Suspense>
    </div>
  );
}
