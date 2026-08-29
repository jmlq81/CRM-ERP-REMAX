"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  Shield,
  UserPlus,
  Trash2,
  Home,
  Users,
  CheckSquare,
  Handshake,
  Coins,
  AlarmClock,
  Crown,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin plataforma",
  OWNER: "Dueño",
  AGENT: "Agente",
};

export default function AdminAgentsPage() {
  const { data: agents, isLoading, isError, error } = trpc.agent.list.useQuery();
  const updateRole = trpc.agent.updateRole.useMutation();
  const deactivateUser = trpc.agent.deactivateUser.useMutation();
  const createUser = trpc.agent.createUser.useMutation();
  const utils = trpc.useUtils();

  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "AGENT" as "OWNER" | "AGENT",
  });

  if (isLoading) {
    return <div className="animate-pulse h-96 rounded-xl bg-gray-200" />;
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-lg font-semibold text-gray-900">Sin acceso</p>
        <p className="mt-2 text-gray-500">
          {error.message === "FORBIDDEN"
            ? "Esta sección es solo para administradores o dueños de empresa."
            : error.message}
        </p>
      </div>
    );
  }

  const filtered = agents?.filter(
    (a) =>
      !filter ||
      a.name?.toLowerCase().includes(filter.toLowerCase()) ||
      a.email?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleRoleChange = (id: string, role: string) => {
    const next = role === "AGENT" ? "OWNER" : "AGENT";
    const msg =
      next === "OWNER"
        ? "¿Convertir a este usuario en Dueño de la empresa?"
        : "¿Quitar el rol de Dueño y dejarlo como Agente?";
    if (!confirm(msg)) return;
    updateRole.mutate(
      { userId: id, role: next },
      { onSuccess: () => utils.agent.list.invalidate(), onError: (e) => alert(e.message) }
    );
  };

  const handleDeactivate = (id: string, name?: string) => {
    if (!confirm(`¿Eliminar a ${name || "este usuario"}? Se perderán sus datos.`)) return;
    deactivateUser.mutate(
      { userId: id },
      { onSuccess: () => utils.agent.list.invalidate(), onError: (e) => alert(e.message) }
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    createUser.mutate(form, {
      onSuccess: () => {
        utils.agent.list.invalidate();
        setShowForm(false);
        setForm({ name: "", email: "", password: "", role: "AGENT" });
      },
      onError: (err) => alert(err.message),
    });
  };

  const totals = agents?.reduce(
    (acc, a) => ({
      properties: acc.properties + a.stats.activeProperties,
      interesados: acc.interesados + a.stats.activeInteresados,
      deals: acc.deals + a.stats.closedDeals,
      commissions:
        acc.commissions +
        (a.stats.pendingCommissions ? Number(a.stats.pendingCommissions) : 0),
    }),
    { properties: 0, interesados: 0, deals: 0, commissions: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
          <p className="text-gray-600">
            Supervisión de agentes, roles y rendimiento de la empresa
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo agente
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Nombre
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="correo@empresa.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Rol
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as "OWNER" | "AGENT" })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="AGENT">Agente</option>
              <option value="OWNER">Dueño</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={createUser.isPending}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {createUser.isPending ? "Creando..." : "Crear agente"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Usuarios</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{agents?.length ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Propiedades activas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totals?.properties ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Interesados activos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totals?.interesados ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Operaciones ganadas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totals?.deals ?? 0}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar agente por nombre o email..."
          className="w-full rounded-lg border bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        {filtered?.map((agent) => (
          <div
            key={agent.id}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {agent.image ? (
                  <img src={agent.image} alt="" className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                    {agent.name?.charAt(0) || "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{agent.name}</p>
                  <p className="text-sm text-gray-500">{agent.email}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      agent.role === "OWNER"
                        ? "bg-amber-100 text-amber-700"
                        : agent.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {roleLabels[agent.role]}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-3">
                  <div>
                    <p className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
                      <Home className="h-3 w-3 text-gray-400" />
                      {agent.stats.activeProperties}
                      <span className="text-xs font-normal text-gray-400">/ {agent.stats.properties}</span>
                    </p>
                    <p className="text-xs text-gray-500">Propiedades</p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
                      <Users className="h-3 w-3 text-gray-400" />
                      {agent.stats.activeInteresados}
                      <span className="text-xs font-normal text-gray-400">/ {agent.stats.interesados}</span>
                    </p>
                    <p className="text-xs text-gray-500">Interesados</p>
                  </div>
                  <div>
                    <p className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-900">
                      <Handshake className="h-3 w-3 text-gray-400" />
                      {agent.stats.closedDeals}
                    </p>
                    <p className="text-xs text-gray-500">Operaciones</p>
                  </div>
                </div>

                <div className="border-l pl-4 text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-900">
                    <Coins className="h-3 w-3 text-green-500" />
                    {formatCurrency(Number(agent.stats.pendingCommissions ?? 0), "PEN")}
                  </p>
                  <p className="text-xs text-gray-500">Comisiones pend.</p>
                  <p className="flex items-center justify-end gap-1 text-xs text-gray-400">
                    <CheckSquare className="h-3 w-3" /> {agent.stats.pendingTasks} tareas
                  </p>
                  <p className="flex items-center justify-end gap-1 text-xs text-gray-400">
                    <AlarmClock className="h-3 w-3" /> {agent.stats.followUpsDue} seguimientos
                  </p>
                </div>

                {agent.role !== "ADMIN" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRoleChange(agent.id, agent.role)}
                      className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50"
                      title={agent.role === "OWNER" ? "Quitar rol de dueño" : "Hacer dueño"}
                    >
                      <Crown className="h-3 w-3" />
                      {agent.role === "OWNER" ? "Quitar dueño" : "Hacer dueño"}
                    </button>
                    <button
                      onClick={() => handleDeactivate(agent.id, agent.name ?? undefined)}
                      disabled={deactivateUser.isPending}
                      className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}