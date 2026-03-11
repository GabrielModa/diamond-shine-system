"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/src/components/ui/StatusBadge";

type NotificationItem = { id: string; title: string; message: string; status: string; createdAt: string };

export function NotificationsPageClient() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => setError("Failed to load notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markAsRead = async (notificationId: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
    load();
  };

  if (loading) return <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading notifications...</p>;
  if (error) return <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;
  if (!items.length) return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No notifications yet.</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">{item.title}</h2>
            <StatusBadge tone={item.status === "READ" ? "neutral" : "warning"}>{item.status}</StatusBadge>
          </div>
          <p className="text-sm text-slate-600">{item.message}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
            {item.status !== "READ" ? (
              <button onClick={() => markAsRead(item.id)} className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white" type="button">Mark as read</button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
