import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RE/MAX CRM - Gestión Inmobiliaria",
  description: "CRM para agentes inmobiliarios RE/MAX",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
