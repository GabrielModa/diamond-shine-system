"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarLink = {
  href: string;
  label: string;
};

const SIDEBAR_LINKS: SidebarLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/supplies", label: "Supplies" },
  { href: "/feedback", label: "Feedback" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full max-w-xs border-r border-slate-200 bg-slate-900 p-4 text-white md:min-h-screen md:w-64 md:max-w-none">
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Diamond Shine
      </p>
      <nav className="flex flex-col gap-2">
        {SIDEBAR_LINKS.map((link) => {
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
