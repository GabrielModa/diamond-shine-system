"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSidebarLinks, type SidebarLink } from "@/src/lib/permissions";
import type { UserRole } from "@/src/types/user";

type SidebarProps = {
  role: UserRole;
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links: SidebarLink[] = getSidebarLinks(role);

  return (
    <aside className="w-full max-w-xs border-r border-slate-200 bg-slate-900 p-4 text-white md:min-h-screen md:w-64 md:max-w-none">
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Diamond Shine
      </p>
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-slate-900"
                  : "text-slate-200 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
