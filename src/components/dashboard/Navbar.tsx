import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

export function Navbar({ title, role }: { title: string; role: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <NotificationBell />
        <UserMenu role={role} />
      </div>
    </header>
  );
}
