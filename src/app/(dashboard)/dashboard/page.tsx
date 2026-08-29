"use client";

import { trpc } from "@/lib/trpc";
import {
  Home,
  Users,
  CheckSquare,
  Clock,
  CalendarClock,
  ChevronRight,
  Coins,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const { data: properties } = trpc.property.list.useQuery({});
  const { data: leads } = trpc.lead.list.useQuery({ limit: 100 });
  const { data: tasks } = trpc.task.list.useQuery({ completed: false });
  const { data: deals } = trpc.deal.list.useQuery({});
  const { data: me } = trpc.user.me.useQuery();

  const pendingCommissions =
    deals
      ?.filter((d) => d.status === "CLOSED_WON")
      .flatMap((d) => d.commissions)
      .filter((c) => c.userId === me?.id && c.status === "PENDING") ?? [];

  const pendingCommissionTotal = pendingCommissions.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  const pendingFollowUps =
    leads?.leads.filter((lead) => {
      if (!lead.nextFollowUpAt) return false;
      return (
        new Date(lead.nextFollowUpAt).setHours(0, 0, 0, 0) <=
        new Date().setHours(0, 0, 0, 0)
      );
    }) ?? [];

  const stats = [
    {
      name: "Propiedades Activas",
      value: properties?.total ?? 0,
      icon: Home,
      color: "bg-blue-500",
    },
    {
      name: "Interesados Totales",
      value: leads?.total ?? 0,
      icon: Users,
      color: "bg-green-500",
    },
    {
      name: "Tareas Pendientes",
      value: tasks?.length ?? 0,
      icon: CheckSquare,
      color: "bg-yellow-500",
    },
    {
      name: "Seguimientos Hoy",
      value: pendingFollowUps.length,
      icon: CalendarClock,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de tu actividad inmobiliaria</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5"
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Seguimientos pendientes
          </h2>
          {pendingFollowUps.length > 0 ? (
            <div className="space-y-3">
              {pendingFollowUps.slice(0, 5).map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{lead.name}</p>
                    <p className="text-sm text-gray-500">
                      {lead.phone || lead.email || lead.source}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-red-600">
                      Vence {new Date(lead.nextFollowUpAt!).toLocaleDateString("es-PE")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No hay seguimientos vencidos. Programe el próximo contacto de cada
              interesado desde su ficha.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Últimas Propiedades
          </h2>
          <div className="space-y-3">
            {properties?.properties.slice(0, 5).map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{property.title}</p>
                  <p className="text-sm text-gray-500">
                    {property.city}, {property.address}
                  </p>
                </div>
                <p className="font-semibold text-red-600">
                  {formatCurrency(Number(property.price), property.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Tareas Pendientes
          </h2>
          <div className="space-y-3">
            {tasks?.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  {task.dueDate && (
                    <p className="text-sm text-gray-500">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString("es-PE")}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    task.priority === "URGENT"
                      ? "bg-red-100 text-red-700"
                      : task.priority === "HIGH"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Mis Comisiones Pendientes
          </h2>
          {pendingCommissions.length > 0 ? (
            <div className="space-y-3">
              {pendingCommissions.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`/deals/${c.dealId}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-green-500" />
                    <p className="font-medium text-gray-900">{c.user.name}</p>
                  </div>
                  <p className="font-semibold text-green-700">
                    {formatCurrency(Number(c.amount), c.currency)}
                  </p>
                </Link>
              ))}
              <p className="pt-2 text-sm font-medium text-gray-700">
                Total: {formatCurrency(pendingCommissionTotal, "PEN")}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No tienes comisiones pendientes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
