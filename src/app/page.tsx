import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
      <div className="text-center text-white">
        <h1 className="mb-4 text-6xl font-bold">RE/MAX CRM</h1>
        <p className="mb-8 text-xl text-red-100">
          Gestión inmobiliaria inteligente para agentes profesionales
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-white px-8 py-3 font-semibold text-red-600 shadow-lg hover:bg-red-50"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="rounded-lg border-2 border-white px-8 py-3 font-semibold hover:bg-white hover:text-red-600"
          >
            Crear Cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
