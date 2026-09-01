"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, KeyRound, Save, User as UserIcon } from "lucide-react";
import Link from "next/link";

interface MeUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "ADMIN" | "OWNER" | "AGENT";
  phone: string | null;
  agency: string | null;
  bio: string | null;
  hasPassword: boolean;
}

function ProfileForm({ user }: { user: MeUser }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    agency: user.agency || "",
    bio: user.bio || "",
  });

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
    },
  });

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          {user.image ? (
            <img src={user.image} alt="" className="h-16 w-16 rounded-full" />
          ) : (
            <UserIcon className="h-8 w-8" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user.name || "Sin nombre"}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              user.role === "ADMIN"
                ? "bg-purple-100 text-purple-700"
                : user.role === "OWNER"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {user.role === "ADMIN"
              ? "Administrador"
              : user.role === "OWNER"
              ? "Dueño"
              : "Agente"}
          </span>
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
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const updatePassword = trpc.user.updatePassword.useMutation({
    onSuccess: () => {
      setPassForm({ currentPassword: "", newPassword: "" });
    },
  });

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <KeyRound className="h-5 w-5 text-gray-400" />
        Acceso con contraseña
      </h2>
      <p className="mb-4 text-sm text-gray-500">
        {hasPassword
          ? "Ya tienes una contraseña. Puedes cambiar tu clave de acceso al sistema reemplazándola."
          : "Aún no tienes contraseña. Al crear una podrás entrar también con email y contraseña."}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updatePassword.mutate({
            currentPassword: hasPassword ? passForm.currentPassword : undefined,
            newPassword: passForm.newPassword,
          });
        }}
        className="space-y-4"
      >
        {hasPassword && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña actual
            </label>
            <input
              type="password"
              value={passForm.currentPassword}
              onChange={(e) =>
                setPassForm({ ...passForm, currentPassword: e.target.value })
              }
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {hasPassword ? "Nueva contraseña" : "Contraseña"} (mín. 6 caracteres)
          </label>
          <input
            type="password"
            value={passForm.newPassword}
            onChange={(e) =>
              setPassForm({ ...passForm, newPassword: e.target.value })
            }
            required
            minLength={6}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {updatePassword.isError && (
          <p className="text-sm text-red-600">
            {updatePassword.error.message}
          </p>
        )}
        {updatePassword.isSuccess && (
          <p className="text-sm text-green-600">
            Contraseña actualizada correctamente.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updatePassword.isPending}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updatePassword.isPending
              ? "Guardando..."
              : hasPassword
              ? "Cambiar contraseña"
              : "Crear contraseña"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const { data: user, isLoading } = trpc.user.me.useQuery();

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

      {user && (
        <>
          <ProfileForm key={user.id} user={user} />
          <PasswordForm hasPassword={!!user.hasPassword} />
        </>
      )}
    </div>
  );
}