"use client";

import { signOut } from "next-auth/react";

export function UserMenu({ role }: { role: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{role}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Sign out
      </button>
    </div>
  );
}
