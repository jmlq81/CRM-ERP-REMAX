"use client";

import { Bell, Search, User, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: user } = trpc.user.me.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/properties?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <form onSubmit={handleSearch} className="hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar propiedades, interesados..."
              className="w-64 rounded-lg border bg-gray-50 py-2 pl-10 pr-4 text-sm md:w-96 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-32 rounded-lg border bg-gray-50 py-2 pl-9 pr-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
        </form>
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100"
        >
          {user?.image ? (
            <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
              <User className="h-4 w-4" />
            </div>
          )}
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-gray-700">
              {user?.name || "Agente"}
            </p>
            <p className="text-xs text-gray-500">
              {user?.company?.name || "RE/MAX"}
              {user?.role && ` · ${user.role === "ADMIN" ? "Administrador" : user.role === "OWNER" ? "Dueño" : "Agente"}`}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}