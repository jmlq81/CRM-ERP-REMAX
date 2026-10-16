import Link from "next/link";
import { TRPCProvider } from "@/lib/trpc-provider";

export default function PublicAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCProvider>
      <div className="min-h-screen bg-white">
        <header className="border-b">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/remax-family-color.png"
                alt="RE/MAX Family"
                className="h-9 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-remax"
              >
                Propiedades
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-gray-600 hover:text-remax"
              >
                Contacto
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t bg-gray-50 py-8">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
            <p>&copy; 2026 RE/MAX Family - Todos los derechos reservados</p>
          </div>
        </footer>
      </div>
    </TRPCProvider>
  );
}
