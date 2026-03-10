import type { ReactNode } from "react";
import Link from "next/link";

type AuthFormShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  subtitle: string;
  title: string;
};

export function AuthFormShell({ children, footer, subtitle, title }: AuthFormShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,1),_rgba(30,41,59,0.96))]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl shadow-slate-950/30">
        <div className="mb-8">
          <Link href="/" className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
            Diamond Shine
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>
        {children}
        {footer ? <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  );
}
