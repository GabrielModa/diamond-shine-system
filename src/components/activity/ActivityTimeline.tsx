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
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-800">
              <span className="font-semibold">{item.action}</span> on {item.entity}
            </p>
            <StatusBadge tone="info">{new Date(item.createdAt).toLocaleString()}</StatusBadge>
          </div>
        </li>
      ))}
    </ol>
  );
}
