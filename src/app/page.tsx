import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-remax-navy">
      <div className="flex flex-col items-center px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/remax-family-color.png"
          alt="RE/MAX Family"
          className="mb-8 h-20 w-auto"
        />
        <p className="mb-8 max-w-xl text-xl text-remax-cream/80">
          Gestión inmobiliaria inteligente para agentes profesionales
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-remax px-8 py-3 font-semibold text-white shadow-lg hover:bg-remax-dark-red"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="rounded-lg border-2 border-white px-8 py-3 font-semibold text-white hover:bg-white hover:text-remax-navy"
          >
            Crear Cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
