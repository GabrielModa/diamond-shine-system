"use client";

import { useMemo, useState, useEffect } from "react";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { Table, TableContainer } from "@/src/components/ui/Table";
import { getStatusTone, readApiError } from "./page-state.utils";

type NotificationItem = { id: string; title: string; message: string; status: string; createdAt: string };

type NotificationCategory = "Supply" | "Feedback" | "Files" | "System";

function getCategory(item: NotificationItem): NotificationCategory {
  const source = `${item.title} ${item.message}`.toLowerCase();
  if (source.includes("supply")) return "Supply";
  if (source.includes("feedback")) return "Feedback";
  if (source.includes("file") || source.includes("upload")) return "Files";
  return "System";
}

export function NotificationsPageClient() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response, "Failed to load notifications."));
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
    await Promise.all(unread.map((item) => markAsRead(item.id)));
  };

  const summary = useMemo(() => ({
    feedback: items.filter((item) => getCategory(item) === "Feedback").length,
    files: items.filter((item) => getCategory(item) === "Files").length,
    supply: items.filter((item) => getCategory(item) === "Supply").length,
    unread: items.filter((item) => item.status !== "READ").length,
  }), [items]);

  if (loading) return <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading notifications...</p>;
  if (error) return <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;
  if (!items.length) return <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No notifications yet.</p>;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Unread" value={String(summary.unread)} />
        <SummaryCard label="Supply events" value={String(summary.supply)} />
        <SummaryCard label="Feedback events" value={String(summary.feedback)} />
        <SummaryCard label="File events" value={String(summary.files)} />
      </section>

      <div className="flex gap-2">
        <button type="button" onClick={() => void markAllAsRead()} className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white">Mark all as read</button>
        <button type="button" onClick={() => void load()} className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700">Refresh</button>
      </div>

      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div key={item.id} className={`rounded-xl border p-4 ${item.status !== "READ" ? "border-amber-300 bg-amber-50/50" : "border-slate-200 bg-white"}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <StatusBadge tone={getStatusTone(item.status)}>{item.status}</StatusBadge>
            </div>
            <p className="text-sm text-slate-600">{item.message}</p>
            <p className="mt-2 text-xs text-slate-500">{getCategory(item)} · {new Date(item.createdAt).toLocaleString()}</p>
            {item.status !== "READ" ? <button onClick={() => void markAsRead(item.id)} className="mt-3 rounded bg-slate-900 px-3 py-1.5 text-xs text-white" type="button">Mark as read</button> : null}
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <TableContainer>
          <Table>
            <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-2">Title</th><th>Category</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2"><p className="font-medium text-slate-900">{item.title}</p><p className="text-xs text-slate-500">{item.message}</p></td>
                  <td>{getCategory(item)}</td>
                  <td><StatusBadge tone={getStatusTone(item.status)}>{item.status}</StatusBadge></td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>{item.status !== "READ" ? <button onClick={() => void markAsRead(item.id)} className="rounded bg-slate-900 px-2 py-1 text-xs text-white" type="button">Mark as read</button> : <span className="text-xs text-slate-500">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
