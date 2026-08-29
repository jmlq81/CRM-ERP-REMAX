"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  Shield,
  ShieldOff,
  Home,
  Users,
  CheckSquare,
  Handshake,
  Coins,
  AlarmClock,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  AGENT: "Agente",
};

export default function AdminAgentsPage() {
  const { data: agents, isLoading, isError, error } = trpc.agent.list.useQuery();
  const updateRole = trpc.agent.updateRole.useMutation();
  const utils = trpc.useUtils();

  const [filter, setFilter] = useState("");

  if (isLoading) {
    return <div className="animate-pulse h-96 rounded-xl bg-gray-200" />;
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-lg font-semibold text-gray-900">Sin acceso</p>
        <p className="mt-2 text-gray-500">
          {error.message === "FORBIDDEN"
            ? "Esta sección es solo para administradores."
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

  const handleRoleToggle = (id: string, role: string) => {
    if (role === "ADMIN") {
      if (!confirm("¿Degradar a este usuario a Agente?")) return;
      updateRole.mutate(
        { userId: id, role: "AGENT" },
        { onSuccess: () => utils.agent.list.invalidate(), onError: (e) => alert(e.message) }
      );
    } else {
      if (!confirm("¿Promover a este usuario a Admin?")) return;
      updateRole.mutate(
        { userId: id, role: "ADMIN" },
        { onSuccess: () => utils.agent.list.invalidate(), onError: (e) => alert(e.message) }
      );
    }
  };

  const totals = agents?.reduce(
    (acc, a) => ({
      properties: acc.properties + a.stats.activeProperties,
      leads: acc.leads + a.stats.activeLeads,
      deals: acc.deals + a.stats.closedDeals,
      commissions:
        acc.commissions +
        (a.stats.pendingCommissions ? Number(a.stats.pendingCommissions) : 0),
    }),
    { properties: 0, leads: 0, deals: 0, commissions: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
        <p className="text-gray-600">
          Supervisión de agentes, roles y rendimiento
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Agentes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{agents?.length ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Propiedades activas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totals?.properties ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Interesados activos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totals?.leads ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Operaciones ganadas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totals?.deals ?? 0}</p>
        </div>
      </div>

      <div
        className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5"
        style={{ boxShadow: "none" }}
      >
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
            <div className="flex items-center justify-between">
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
                      agent.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {roleLabels[agent.role]}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="grid grid-cols-3 gap-6 text-center">
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
                      {agent.stats.activeLeads}
                      <span className="text-xs font-normal text-gray-400">/ {agent.stats.leads}</span>
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

                <div className="border-l pl-6 text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-900">
                    <Coins className="h-3 w-3 text-green-500" />
                    {formatCurrency(
                      Number(agent.stats.pendingCommissions ?? 0),
                      "PEN"
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Comisiones pend.</p>
                  <p className="flex items-center justify-end gap-1 text-xs text-gray-400">
                    <CheckSquare className="h-3 w-3" /> {agent.stats.pendingTasks} tareas
                  </p>
                  <p className="flex items-center justify-end gap-1 text-xs text-gray-400">
                    <AlarmClock className="h-3 w-3" /> {agent.stats.followUpsDue} seguimientos
                  </p>
                </div>

                <button
                  onClick={() => handleRoleToggle(agent.id, agent.role)}
                  className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                    agent.role === "ADMIN"
                      ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                      : "border-purple-200 text-purple-600 hover:bg-purple-50"
                  }`}
                  title={agent.role === "ADMIN" ? "Degradar a agente" : "Promover a admin"}
                >
                  {agent.role === "ADMIN" ? (
                    <>
                      <ShieldOff className="h-3 w-3" />
                      Degradar
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3" />
                      Hacer Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}