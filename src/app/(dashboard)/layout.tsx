"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { TRPCProvider } from "@/lib/trpc-provider";
import { trpc } from "@/lib/trpc";

function NoCompanyRedirect() {
  const router = useRouter();
  const me = trpc.user.me.useQuery();
  useEffect(() => {
    if (!me.isLoading && me.data && !me.data.companyId) {
      router.replace("/bienvenido");
    }
  }, [me.data, me.isLoading, router]);
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TRPCProvider>
      <NoCompanyRedirect />
      <div className="flex h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </TRPCProvider>
  );
}