"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Check, Clock, AlertCircle, Trash2 } from "lucide-react";

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.task.list.useQuery({});

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      setShowForm(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("MEDIUM");
    },
  });

  const toggleComplete = trpc.task.toggleComplete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
  });

  const pendingTasks = tasks?.tasks?.filter((t) => !t.completed) ?? [];
  const completedTasks = tasks?.tasks?.filter((t) => t.completed) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate({
      title,
      description: description || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
          <p className="text-gray-600">Gestiona tus tareas y seguimientos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Tarea
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha límite
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {createTask.isPending ? "Guardando..." : "Crear Tarea"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Pendientes ({pendingTasks.length})
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border p-4">
                <div className="h-4 w-1/3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : pendingTasks.length > 0 ? (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleComplete.mutate({ id: task.id })}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 hover:border-green-500"
                  >
                    {task.completed && <Check className="h-4 w-4 text-green-500" />}
                  </button>
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    {task.dueDate && (
                      <p className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString("es-PE")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      priorityColors[task.priority] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.priority}
                  </span>
                  <button
                    onClick={() => deleteTask.mutate({ id: task.id })}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No hay tareas pendientes</p>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Completadas ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border p-4 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleComplete.mutate({ id: task.id })}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500"
                  >
                    <Check className="h-4 w-4 text-white" />
                  </button>
                  <p className="text-gray-500 line-through">{task.title}</p>
                </div>
                <button
                  onClick={() => deleteTask.mutate({ id: task.id })}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
