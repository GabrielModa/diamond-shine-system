import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return <table className="min-w-full text-left text-sm">{children}</table>;
}

export function TableContainer({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">{children}</div>;
}
