"use client";

import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  Users,
  Home as HomeIcon,
  DollarSign,
  Percent,
} from "lucide-react";

export default function ReportsPage() {
  const { data: properties } = trpc.property.list.useQuery({});
  const { data: leads } = trpc.lead.list.useQuery({});
  const { data: tasks } = trpc.task.list.useQuery({});

  if (!properties || !leads || !tasks) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  const activeProperties = properties.properties.filter((p) => p.status === "ACTIVE");
  const soldProperties = properties.properties.filter((p) => p.status === "SOLD");
  const totalValue = properties.properties.reduce(
    (sum, p) => sum + Number(p.price),
    0
  );

  const newLeads = leads.leads.filter((l) => l.status === "NEW");
  const wonLeads = leads.leads.filter((l) => l.status === "CLOSED_WON");
  const conversionRate = leads.total > 0
    ? ((wonLeads.length / leads.total) * 100).toFixed(1)
    : "0";

  const completedTasks = tasks.filter((t) => t.completed);

  const statusCount = (status: string) =>
    properties.properties.filter((p) => p.status === status).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Estadísticas y rendimiento de tu negocio</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500 p-3">
              <HomeIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor Total Cartera</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(Number(totalValue))}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500 p-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasa de Conversión</p>
              <p className="text-xl font-bold text-gray-900">{conversionRate}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500 p-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Interesados Nuevos</p>
              <p className="text-xl font-bold text-gray-900">{newLeads.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500 p-3">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Propiedades Vendidas</p>
              <p className="text-xl font-bold text-gray-900">{soldProperties.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Propiedades por Estado
          </h2>
          <div className="space-y-4">
            {[
              { label: "Activas", value: statusCount("ACTIVE"), color: "bg-green-500" },
              { label: "Vendidas", value: statusCount("SOLD"), color: "bg-blue-500" },
              { label: "Alquiladas", value: statusCount("RENTED"), color: "bg-purple-500" },
              { label: "Inactivas", value: statusCount("INACTIVE"), color: "bg-gray-500" },
              { label: "Pendientes", value: statusCount("PENDING"), color: "bg-yellow-500" },
            ].map((item) => {
              const total = properties.properties.length || 1;
              const percentage = ((item.value / total) * 100).toFixed(0);
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <span className="text-gray-500">
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Interesados por Estado
          </h2>
          <div className="space-y-3">
            {[
              { label: "Nuevos", value: leads.leads.filter((l) => l.status === "NEW").length, color: "text-blue-600" },
              { label: "Contactados", value: leads.leads.filter((l) => l.status === "CONTACTED").length, color: "text-yellow-600" },
              { label: "Calificados", value: leads.leads.filter((l) => l.status === "QUALIFIED").length, color: "text-purple-600" },
              { label: "Negociación", value: leads.leads.filter((l) => l.status === "NEGOTIATION").length, color: "text-orange-600" },
              { label: "Cerrados Ganados", value: wonLeads.length, color: "text-green-600" },
              { label: "Cerrados Perdidos", value: leads.leads.filter((l) => l.status === "CLOSED_LOST").length, color: "text-red-600" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className={`font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Resumen General
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {properties.total}
            </p>
            <p className="text-sm text-gray-500">Total Propiedades</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{leads.total}</p>
            <p className="text-sm text-gray-500">Total interesados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
            <p className="text-sm text-gray-500">
              Tareas ({completedTasks.length} completadas)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
