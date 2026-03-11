import type { ReactNode } from "react";
import { requireAuthenticatedRoute } from "@/src/lib/auth";
import type { AppRoute } from "@/src/types/permissions";
import type { UserRole } from "@/src/types/user";
import { Navbar } from "./Navbar";
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
      <main className="flex-1 p-5 md:p-8">
        <Navbar title={title} role={activeRole} />
        {children}
      </main>
    </div>
  );
}
