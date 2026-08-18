"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: user, isLoading } = trpc.user.me.useQuery();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    agency: "",
    bio: "",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user && !loaded) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        agency: user.agency || "",
        bio: user.bio || "",
      });
      setLoaded(true);
    }
  }, [user, loaded]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Gestiona tu perfil y preferencias</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            {user?.image ? (
              <img src={user.image} alt="" className="h-16 w-16 rounded-full" />
            ) : (
              <UserIcon className="h-8 w-8" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name || "Sin nombre"}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile.mutate(form);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Agencia
            </label>
            <input
              type="text"
              value={form.agency}
              onChange={(e) => setForm({ ...form, agency: e.target.value })}
              placeholder="RE/MAX"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateProfile.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>

        {updateProfile.isSuccess && (
          <p className="mt-4 text-sm text-green-600">Perfil actualizado correctamente.</p>
        )}
      </div>
    </div>
  );
}
