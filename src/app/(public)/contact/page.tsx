"use client";

import { useState } from "react";
import { Send, Phone, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Contáctanos</h1>
        <p className="mt-3 text-lg text-gray-600">
          Estamos aquí para ayudarte con la compra, venta o alquiler de tu propiedad
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Información de contacto</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Teléfono</h3>
                <p className="text-gray-600">+51 999 888 777</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email</h3>
                <p className="text-gray-600">contacto@remax-familia.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Oficina</h3>
                <p className="text-gray-600">Av. Principal 123, Lima, Perú</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-950/5">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">¡Mensaje enviado!</h3>
              <p className="mt-2 text-gray-600">
                Nos pondremos en contacto contigo a la brevedad.
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", email: "", phone: "", message: "" });
                }}
                className="mt-4 text-sm font-semibold text-red-600 hover:text-red-500"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
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
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mensaje *
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  required
                  placeholder="Cuéntanos en qué podemos ayudarte..."
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
              >
                <Send className="h-4 w-4" />
                Enviar mensaje
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
