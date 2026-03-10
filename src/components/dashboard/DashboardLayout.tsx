import type { ReactNode } from "react";
import { requireAuthenticatedRoute } from "@/src/lib/auth";
import type { AppRoute } from "@/src/types/permissions";
import type { UserRole } from "@/src/types/user";
import { Sidebar } from "./Sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
  currentPath: AppRoute;
  role?: UserRole;
  title: string;
};

export async function DashboardLayout({ children, currentPath, role, title }: DashboardLayoutProps) {
  const activeRole = role ?? (await requireAuthenticatedRoute(currentPath)).role;

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar role={activeRole} />
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-6 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}
