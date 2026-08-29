"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Home,
  Users,
  CheckSquare,
  Globe,
  BarChart3,
  Handshake,
  Shield,
  Building2,
  Settings,
  LogOut,
  X,
  Menu,
} from "lucide-react";

const ROLES_MANAGER = ["ADMIN", "OWNER"] as const;

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "AGENT";
  const isManager = (ROLES_MANAGER as readonly string[]).includes(role);
  const { data: empresa } = trpc.empresa.context.useQuery(undefined, {
    retry: false,
  });

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Propiedades", href: "/properties", icon: Home },
    { name: "Interesados", href: "/interesados", icon: Users },
    { name: "Operaciones", href: "/deals", icon: Handshake },
    { name: "Tareas", href: "/tasks", icon: CheckSquare },
    { name: "Publicar", href: "/publish", icon: Globe },
    { name: "Reportes", href: "/reports", icon: BarChart3 },
    ...(isManager
      ? [{ name: "Equipo", href: "/admin/agents", icon: Shield }]
      : []),
    ...(role === "ADMIN"
      ? [{ name: "Empresas", href: "/admin/empresas", icon: Building2 }]
      : []),
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-white transition-transform lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={onClose}
          >
            <Home className="h-8 w-8 text-red-500" />
            <span className="text-xl font-bold">RE/MAX CRM</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-300 hover:bg-gray-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          {empresa?.nombre && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-800/60 px-3 py-2">
              <Building2 className="h-4 w-4 text-red-400" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">
                  {empresa.nombre}
                </p>
                <p className="text-[10px] text-gray-400">
                  {empresa.rol === "ADMIN" ? "Administrador" : empresa.rol === "OWNER" ? "Dueño" : "Agente"}
                </p>
              </div>
            </div>
          )}
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Settings className="h-5 w-5" />
            Configuración
          </Link>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}