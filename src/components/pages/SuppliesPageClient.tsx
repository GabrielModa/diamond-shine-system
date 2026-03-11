"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { getStatusTone, getSupplyWorkflowState, readApiError } from "./page-state.utils";

type UserRole = "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER";
type SupplyStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

type SupplyRow = {
  id: string;
  item: string;
  quantity: number;
  department: string;
  status: SupplyStatus;
  requestDate: string;
  requesterId: string;
};

export function SuppliesPageClient({ role }: { role: UserRole }) {
  const [rows, setRows] = useState<SupplyRow[]>([]);
  const [item, setItem] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canCreate = role === "ADMIN" || role === "EMPLOYEE";
  const canReview = role === "ADMIN" || role === "SUPERVISOR";

  const pendingCount = useMemo(() => rows.filter((row) => row.status === "PENDING").length, [rows]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/supplies", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to load supply requests."));
      }

      setRows((await response.json()) as SupplyRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load supply requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createSupply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/supplies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, quantity, department, priority, notes }),
    });

    if (!response.ok) {
      setError(await readApiError(response, "Failed to create supply request."));
      return;
    }

    setItem("");
    setDepartment("");
    setPriority("MEDIUM");
    setNotes("");
    setQuantity(1);
    await load();
  };

  const transition = async (requestId: string, action: "approve" | "reject" | "complete") => {
    setError("");
    const response = await fetch("/api/supplies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, requestId }),
    });

    if (!response.ok) {
      setError(await readApiError(response, "Failed to update request."));
      return;
    }

    await load();
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Supply requests</h2>
          <StatusBadge tone="warning">{pendingCount} pending</StatusBadge>
        </div>
        <p className="mt-1 text-xs text-slate-600">Employee submits request → supervisor approves or rejects → approved requests can be completed.</p>
      </section>

      {canCreate ? (
        <form onSubmit={createSupply} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Create request</h3>
          <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
          <div className="grid grid-cols-2 gap-3">
            <input value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} type="number" min={1} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
          </div>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="LOW">Low priority</option>
            <option value="MEDIUM">Medium priority</option>
            <option value="HIGH">High priority</option>
          </select>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Notes" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Submit request</button>
        </form>
      ) : null}

      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading supply requests...</p> : null}

      {!loading && !rows.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No supply requests found.</p> : null}

      {!loading && rows.length ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.item}</p>
                  <p className="text-xs text-slate-600">Qty {row.quantity} · {row.department}</p>
                </div>
                <StatusBadge tone={getStatusTone(row.status)}>{row.status}</StatusBadge>
              </div>
              <p className="mt-2 text-xs text-slate-600">{getSupplyWorkflowState(row.status)}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(row.requestDate).toLocaleString()}</p>

              {canReview && row.status === "PENDING" ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => void transition(row.id, "approve")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Approve</button>
                  <button type="button" onClick={() => void transition(row.id, "reject")} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white">Reject</button>
                </div>
              ) : null}
              {canReview && row.status === "APPROVED" ? (
                <button type="button" onClick={() => void transition(row.id, "complete")} className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Complete request</button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
