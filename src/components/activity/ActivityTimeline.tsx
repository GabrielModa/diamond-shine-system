import { StatusBadge } from "@/src/components/ui/StatusBadge";

type ActivityItem = {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No recent activity yet.</p>;
  }

  return (
    <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-3 before:top-2 before:w-px before:bg-slate-200">
      {items.map((item) => (
        <li key={item.id} className="relative rounded-xl border border-slate-200 bg-white p-4 pl-7">
          <span className="absolute left-[9px] top-6 h-2 w-2 rounded-full bg-slate-500" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-800">
              <span className="font-semibold">{item.action}</span> · {item.entity}
            </p>
            <StatusBadge tone="info">{new Date(item.createdAt).toLocaleString()}</StatusBadge>
          </div>
        </li>
      ))}
    </ol>
  );
}
