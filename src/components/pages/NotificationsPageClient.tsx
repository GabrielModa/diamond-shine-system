"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { getStatusTone, readApiError } from "./page-state.utils";

type NotificationItem = { id: string; title: string; message: string; status: string; createdAt: string };

export function NotificationsPageClient() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to load notifications."));
      }

      setItems((await response.json()) as NotificationItem[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markAsRead = async (notificationId: string) => {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });

    if (!response.ok) {
      setError(await readApiError(response, "Failed to mark notification as read."));
      return;
    }

    await load();
  };

  const markAllAsRead = async () => {
    const unread = items.filter((item) => item.status !== "READ");
    for (const item of unread) {
      await markAsRead(item.id);
    }
  };

  if (loading) return <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading notifications...</p>;
  if (error) return <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;
  if (!items.length) return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No notifications yet.</p>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => void markAllAsRead()} className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white">Mark all as read</button>
        <button type="button" onClick={() => void load()} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Refresh</button>
      </div>
      {items.map((item) => (
        <div key={item.id} className={`rounded-xl border p-4 ${item.status !== "READ" ? "border-amber-300 bg-amber-50/50" : "border-slate-200 bg-white"}`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">{item.title}</h2>
            <StatusBadge tone={getStatusTone(item.status)}>{item.status}</StatusBadge>
          </div>
          <p className="text-sm text-slate-600">{item.message}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
            {item.status !== "READ" ? (
              <button onClick={() => void markAsRead(item.id)} className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white" type="button">Mark as read</button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
