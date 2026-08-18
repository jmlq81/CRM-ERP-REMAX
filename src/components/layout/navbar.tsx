"use client";

import { Bell, Search, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";

export function Navbar() {
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
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <form onSubmit={handleSearch} className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar propiedades, leads..."
            className="w-96 rounded-lg border bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
      </form>

      <div className="flex items-center gap-4">
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
          <div className="text-left">
            <p className="text-sm font-medium text-gray-700">{user?.name || "Agente"}</p>
            <p className="text-xs text-gray-500">RE/MAX</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
