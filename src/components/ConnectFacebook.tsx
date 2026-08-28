"use client";

import { useState, useCallback } from "react";
import { Loader2, Link2, Unlink, AlertCircle, CheckCircle2 } from "lucide-react";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface ConnectedAccount {
  id: string;
  pageId: string;
  pageName: string;
  tokenExpiresAt: string | null;
}

interface FacebookSDK {
  init(options: { appId?: string; xfbml?: boolean; version?: string }): void;
  login(
    cb: (response: { authResponse?: { accessToken?: string }; status?: string }) => void,
    options?: { scope?: string }
  ): void;
}

declare global {
  interface Window {
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
  }
}

const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

function loadFacebookSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FB) return resolve();
    if (!APP_ID) return reject(new Error("Falta NEXT_PUBLIC_FACEBOOK_APP_ID"));
    const existing = document.getElementById("facebook-jssdk");
    if (existing) {
      window.fbAsyncInit = () => resolve();
      return;
    }
    window.fbAsyncInit = () => resolve();
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("No se pudo cargar el SDK de Facebook"));
    document.body.appendChild(script);
  });
}

async function waitForFB(): Promise<FacebookSDK> {
  for (let i = 0; i < 50; i++) {
    if (window.FB) return window.FB;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Facebook SDK no cargó");
}

export default function ConnectFacebook({
  accounts,
  onAccountsChange,
}: {
  accounts: ConnectedAccount[];
  onAccountsChange: () => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setStatus(null);
    setConnecting(true);
    try {
      await loadFacebookSDK();
      const FB = await waitForFB();
      FB.init({
        appId: APP_ID,
        xfbml: true,
        version: "v19.0",
      });

      const loginResult = await new Promise<{ authResponse?: { accessToken?: string }; status?: string }>((resolve) => {
        FB.login(resolve, {
          scope: "pages_manage_posts,pages_read_engagement,public_profile",
        });
      });

      if (!loginResult.authResponse?.accessToken) {
        setStatus({ success: false, message: "No se autorizó la conexión con Facebook." });
        setConnecting(false);
        return;
      }

      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${loginResult.authResponse.accessToken}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      setPages(data.data || []);
      setSelectedPageId("");
      if (!data.data?.length) {
        setStatus({
          success: false,
          message: "No administras ninguna página de Facebook. Crea una página primero.",
        });
      }
    } catch (e) {
      setStatus({ success: false, message: e instanceof Error ? e.message : "Error conectando con Facebook" });
    }
    setConnecting(false);
  }, []);

  const handleSelectPage = async (pageId: string) => {
    setStatus(null);
    setSelectedPageId(pageId);
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    setConnecting(true);
    try {
      const res = await fetch("/api/facebook/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          pageName: page.name,
          accessToken: page.access_token,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error guardando conexión");
      setPages([]);
      setSelectedPageId("");
      setStatus({ success: true, message: `Conectado a la página "${page.name}"` });
      onAccountsChange();
    } catch (e) {
      setStatus({ success: false, message: e instanceof Error ? e.message : "Error guardando conexión" });
    }
    setConnecting(false);
  };

  const handleDisconnect = async (id: string) => {
    setDisconnectingId(id);
    try {
      const res = await fetch("/api/facebook/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al desconectar");
      onAccountsChange();
    } catch {
      setStatus({ success: false, message: "Error al desconectar la página" });
    }
    setDisconnectingId(null);
  };

  return (
    <div className="space-y-4">
      {accounts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <FacebookIcon className="mx-auto mb-3 h-10 w-10 text-blue-600" />
          <p className="mb-4 text-sm text-gray-600">
            Conecta tu página de Facebook para publicar propiedades con un solo clic.
          </p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {connecting ? "Conectando..." : "Conectar con Facebook"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <FacebookIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{acc.pageName}</p>
                  <p className="text-xs text-gray-500">ID: {acc.pageId}</p>
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(acc.id)}
                disabled={disconnectingId === acc.id}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600"
              >
                {disconnectingId === acc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                Desconectar
              </button>
            </div>
          ))}
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            + Conectar otra página
          </button>
        </div>
      )}

      {pages.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="mb-3 text-sm font-medium text-gray-900">Elige la página que quieres conectar:</p>
          <div className="space-y-2">
            {pages.map((page) => (
              <button
                key={page.id}
                onClick={() => handleSelectPage(page.id)}
                disabled={connecting}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="text-sm font-medium text-gray-900">{page.name}</span>
                {connecting && selectedPageId === page.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <span className="text-xs text-blue-600">Conectar</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {status && (
        <div className={`flex items-start gap-2 rounded-lg p-3 ${status.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {status.success ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <p className="text-sm">{status.message}</p>
        </div>
      )}
    </div>
  );
}
