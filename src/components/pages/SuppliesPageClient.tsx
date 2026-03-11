"use client";

import { type FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { Table, TableContainer } from "@/src/components/ui/Table";
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
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canCreate = role === "ADMIN" || role === "EMPLOYEE";
  const canReview = role === "ADMIN" || role === "SUPERVISOR";

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

  useEffect(() => { void load(); }, []);

  const createSupply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/supplies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item, quantity, department }),
    });

    if (!response.ok) {
      setError(await readApiError(response, "Failed to create supply request."));
      return;
    }

    setItem("");
    setDepartment("");
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
    <div className="space-y-5">
      {canCreate ? (
        <form onSubmit={createSupply} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
          <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item" className="rounded border px-3 py-2 text-sm" required />
          <input value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} type="number" min={1} className="rounded border px-3 py-2 text-sm" required />
          <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" className="rounded border px-3 py-2 text-sm" required />
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Create Request</button>
        </form>
      ) : null}

      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading supply requests...</p> : null}
      {!loading && !rows.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No supply requests found.</p> : null}

      {!loading && rows.length ? (
        <TableContainer>
          <Table>
            <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-2">Item</th><th>Qty</th><th>Department</th><th>Status</th><th>Workflow</th><th>Requested</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-2">{row.item}</td>
                  <td>{row.quantity}</td>
                  <td>{row.department}</td>
                  <td><StatusBadge tone={getStatusTone(row.status)}>{row.status}</StatusBadge></td>
                  <td className="text-xs text-slate-600">{getSupplyWorkflowState(row.status)}</td>
                  <td>{new Date(row.requestDate).toLocaleDateString()}</td>
                  <td className="py-2">
                    {canReview && row.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void transition(row.id, "approve")} className="rounded bg-emerald-700 px-2 py-1 text-xs text-white">Approve</button>
                        <button type="button" onClick={() => void transition(row.id, "reject")} className="rounded bg-rose-700 px-2 py-1 text-xs text-white">Reject</button>
                      </div>
                    ) : null}
                    {canReview && row.status === "APPROVED" ? (
                      <button type="button" onClick={() => void transition(row.id, "complete")} className="rounded bg-slate-900 px-2 py-1 text-xs text-white">Complete</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : null}
    </div>
  );
}
