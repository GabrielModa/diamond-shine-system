import type { InputHTMLAttributes, ReactNode } from "react";

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">{children}</label>;
}

export function FieldInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 ${props.className ?? ""}`} />;
}
