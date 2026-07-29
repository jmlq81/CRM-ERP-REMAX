import Link from "next/link";

export default function PublicAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-red-600">RE/MAX</span>
            <span className="text-xl text-gray-600">|</span>
            <span className="text-lg text-gray-800">Agente Inmobiliario</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-red-600">
              Propiedades
            </Link>
            <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-red-600">
              Contacto
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          <p>&copy; 2026 RE/MAX - Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
}
