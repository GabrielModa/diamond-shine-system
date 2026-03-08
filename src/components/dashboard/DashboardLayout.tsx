import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { authOptions } from "@/src/lib/auth";
import { getSidebarLinks } from "@/src/lib/permissions";
import type { UserRole } from "@/src/types/user";
import { Sidebar } from "./Sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
  currentPath: "/dashboard" | "/users" | "/supplies" | "/feedback";
  title: string;
};

export async function DashboardLayout({ children, currentPath, title }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const role = (session.user.role as UserRole | undefined) ?? "VIEWER";
  const allowedLinks = getSidebarLinks(role);
  const canAccessCurrentPage = allowedLinks.some((link) => link.href === currentPath);

  if (!canAccessCurrentPage) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-6 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        </header>
        {children}
      </main>
    </div>
  );
}
