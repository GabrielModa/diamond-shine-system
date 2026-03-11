"use client";

import type { ReactNode } from "react";

export function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100" type="button">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
