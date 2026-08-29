"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  Plus,
  Users,
  Crown,
  Shield,
  Home,
  User as UserIcon,
  CheckSquare,
  Handshake,
  DoorOpen,
} from "lucide-react";

export default function AdminEmpresasPage() {
  const router = useRouter();
  const { data: empresas, isLoading, isError, error } = trpc.empresa.list.useQuery();
  const createEmpresa = trpc.empresa.create.useMutation();
  const updateEmpresa = trpc.empresa.update.useMutation();
  const switchEmpresa = trpc.empresa.switch.useMutation();
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ruc: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    maxAgents: "",
    maxProperties: "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  if (isLoading) {
    return <div className="animate-pulse h-96 rounded-xl bg-gray-200" />;
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-lg font-semibold text-gray-900">Sin acceso</p>
        <p className="mt-2 text-gray-500">
          {error.message === "FORBIDDEN"
            ? "Solo el administrador de plataforma puede gestionar empresas."
            : error.message}
        </p>
      </div>
    );
  }

  const totalUsers = empresas?.reduce((acc, e) => acc + e.totalUsers, 0) ?? 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (form.ownerPassword.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    createEmpresa.mutate(
      {
        name: form.name,
        ruc: form.ruc,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPassword: form.ownerPassword,
        maxAgents: form.maxAgents === "" ? undefined : Number(form.maxAgents),
        maxProperties: form.maxProperties === "" ? undefined : Number(form.maxProperties),
      },
      {
        onSuccess: () => {
          utils.empresa.list.invalidate();
          setShowForm(false);
          setForm({ name: "", ruc: "", ownerName: "", ownerEmail: "", ownerPassword: "", maxAgents: "", maxProperties: "" });
        },
        onError: (err) => setErrorMsg(err.message),
      }
    );
  };

  const handleToggleActive = (id: string, active: boolean) => {
    if (!confirm(active ? "¿Desactivar esta empresa? Sus usuarios no podrán operar." : "¿Activar esta empresa?")) return;
    updateEmpresa.mutate(
      { id, active: !active },
      { onSuccess: () => utils.empresa.list.invalidate(), onError: (err) => alert(err.message) }
    );
  };

  const handleEnter = (id: string) => {
    switchEmpresa.mutate(
      { empresaId: id },
      {
        onSuccess: () => {
          router.push("/dashboard");
          router.refresh();
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600">
            Panel de control: empresas, usuarios por rol y acceso al panel de cada una
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Nueva empresa
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5"
        >
          <p className="mb-4 text-sm font-semibold text-gray-900">
            Crear empresa y su dueño
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Nombre de la empresa
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Agencia Inmobiliaria XYZ"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                RUC (11 dígitos)
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={11}
                value={form.ruc}
                onChange={(e) => setForm({ ...form, ruc: e.target.value.replace(/\D/g, "") })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="20512345678"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Identificador tributario (análogo al CPF/CNPJ brasileño)
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Nombre del dueño (broker)
              </label>
              <input
                type="text"
                required
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Nombre del dueño"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Email del dueño
              </label>
              <input
                type="email"
                required
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="dueño@empresa.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Contraseña del dueño
              </label>
              <input
                type="password"
                required
                value={form.ownerPassword}
                onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Tope de usuarios (dejar vacío = sin límite)
              </label>
              <input
                type="number"
                min={0}
                value={form.maxAgents}
                onChange={(e) => setForm({ ...form, maxAgents: e.target.value.replace(/\D/g, "") })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Ej. 5"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Tope de propiedades (dejar vacío = sin límite)
              </label>
              <input
                type="number"
                min={0}
                value={form.maxProperties}
                onChange={(e) => setForm({ ...form, maxProperties: e.target.value.replace(/\D/g, "") })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Ej. 50"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createEmpresa.isPending}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {createEmpresa.isPending ? "Creando..." : "Crear empresa"}
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Se creará automáticamente el usuario dueño con acceso directo al
            panel de su empresa, donde podrá crear sus propios agentes.
          </p>
          {errorMsg && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
        </form>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <Building2 className="h-4 w-4" /> Empresas
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{empresas?.length ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="h-4 w-4" /> Usuarios
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalUsers}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Dueños (brokers)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {empresas?.reduce((acc, e) => acc + (e.counts.OWNER ?? 0), 0) ?? 0}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-950/5">
          <p className="text-sm text-gray-500">Agentes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {empresas?.reduce((acc, e) => acc + (e.counts.AGENT ?? 0), 0) ?? 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {empresas?.map((empresa) => (
          <div
            key={empresa.id}
            className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{empresa.name}</h3>
                  <p className="text-xs text-gray-500">
                    RUC {empresa.ruc ?? "—"}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  empresa.active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {empresa.active ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span className="text-gray-600">Dueño (broker)</span>
                  <span className="ml-auto font-semibold">{empresa.counts.OWNER ?? 0}</span>
                </div>
                {empresa.owners.length > 0 && (
                  <p className="mt-1 pl-6 text-xs text-gray-600">
                    {empresa.owners.map((o) => `${o.name} (${o.email})`).join(", ")}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Agentes</span>
                  <span className="ml-auto font-semibold">{empresa.counts.AGENT ?? 0}</span>
                </div>
                <p className="mt-1 pl-6 text-xs text-gray-600">
                  {empresa.agents.length > 0
                    ? empresa.agents.map((a) => a.name).join(", ")
                    : "Sin agentes"}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <span className="text-gray-600">Admins</span>
                <span className="ml-auto font-semibold">{empresa.counts.ADMIN ?? 0}</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs text-gray-500 sm:grid-cols-4">
              <div>
                <p className="text-base font-semibold text-gray-900">{empresa.properties}</p>
                Propiedades
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{empresa.interesados}</p>
                Interesados
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{empresa.deals}</p>
                Operaciones
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{empresa.tasks}</p>
                Tareas
              </div>
            </div>

            <CapsEditor
              id={empresa.id}
              userCount={empresa.userCount}
              propertyCount={empresa.properties}
              maxAgents={empresa.maxAgents}
              maxProperties={empresa.maxProperties}
            />

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleEnter(empresa.id)}
                disabled={!empresa.active || switchEmpresa.isPending}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DoorOpen className="h-4 w-4" />
                Entrar al panel
              </button>
              <button
                onClick={() => handleToggleActive(empresa.id, empresa.active)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                {empresa.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CapsEditor({
  id,
  userCount,
  propertyCount,
  maxAgents,
  maxProperties,
}: {
  id: string;
  userCount: number;
  propertyCount: number;
  maxAgents: number | null;
  maxProperties: number | null;
}) {
  const updateEmpresa = trpc.empresa.update.useMutation();
  const utils = trpc.useUtils();
  const [agents, setAgents] = useState(maxAgents == null ? "" : String(maxAgents));
  const [props, setProps] = useState(maxProperties == null ? "" : String(maxProperties));

  const originalAgents = maxAgents == null ? "" : String(maxAgents);
  const originalProps = maxProperties == null ? "" : String(maxProperties);
  const dirty = agents !== originalAgents || props !== originalProps;

  const save = () => {
    updateEmpresa.mutate(
      {
        id,
        maxAgents: agents === "" ? null : Number(agents),
        maxProperties: props === "" ? null : Number(props),
      },
      {
        onSuccess: () => {
          utils.empresa.list.invalidate();
          alert("Topes guardados. Se usan para la cotización de servicio por empresa.");
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  return (
    <div className="mt-3 rounded-lg border border-dashed border-gray-300 p-3">
      <p className="mb-2 text-xs font-semibold text-gray-700">
        Topes (para cotización de servicio por empresa)
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          Usuarios
          <input
            type="number"
            min={0}
            value={agents}
            onChange={(e) => setAgents(e.target.value.replace(/\D/g, ""))}
            placeholder="sin límite"
            className="w-20 rounded border px-2 py-1 text-sm"
          />
          <span className="font-medium">
            {maxAgents != null ? `${userCount}/${maxAgents}` : userCount}
          </span>
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          Propiedades
          <input
            type="number"
            min={0}
            value={props}
            onChange={(e) => setProps(e.target.value.replace(/\D/g, ""))}
            placeholder="sin límite"
            className="w-20 rounded border px-2 py-1 text-sm"
          />
          <span className="font-medium">
            {maxProperties != null ? `${propertyCount}/${maxProperties}` : propertyCount}
          </span>
        </label>
      </div>
      {dirty && (
        <button
          onClick={save}
          disabled={updateEmpresa.isPending}
          className="mt-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {updateEmpresa.isPending ? "Guardando..." : "Guardar topes"}
        </button>
      )}
    </div>
  );
}