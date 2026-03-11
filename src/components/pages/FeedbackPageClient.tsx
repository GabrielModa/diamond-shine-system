"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { Table, TableContainer } from "@/src/components/ui/Table";
import { getStatusTone, readApiError } from "./page-state.utils";

type UserRole = "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER";
type FeedbackRow = { id: string; employeeId: string; reviewerId: string; score: number; comments: string; date: string };

export function FeedbackPageClient({ currentUserId, role }: { currentUserId: string; role: UserRole }) {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [score, setScore] = useState(5);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<FeedbackRow | null>(null);

  const canReview = role === "ADMIN" || role === "SUPERVISOR";

  const history = useMemo(() => rows.filter((row) => row.employeeId === currentUserId), [currentUserId, rows]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/feedback", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to load feedback."));
      }

      setRows((await response.json()) as FeedbackRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, score, comments }),
    });

    if (!response.ok) {
      setError(await readApiError(response, "Failed to submit feedback."));
      return;
    }

    setEmployeeId("");
    setScore(5);
    setComments("");
    await load();
  };

  const saveReview = async (feedbackId: string, nextScore: number, nextComments: string) => {
    const response = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId, score: nextScore, comments: nextComments }),
    });

    if (!response.ok) {
      setError(await readApiError(response, "Failed to update feedback."));
      return;
    }

    setEditing(null);
    await load();
  };

  return (
    <div className="space-y-5">
      {canReview ? (
        <form onSubmit={submitFeedback} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
          <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Employee ID" className="rounded border px-3 py-2 text-sm" required />
          <input value={score} onChange={(e) => setScore(Number(e.target.value))} type="number" min={1} max={10} className="rounded border px-3 py-2 text-sm" required />
          <input value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Comments" className="rounded border px-3 py-2 text-sm" required />
          <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Submit Feedback</button>
        </form>
      ) : null}

      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading feedback...</p> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Employee feedback history</h2>
        {!history.length ? <p className="text-sm text-slate-500">No feedback history available.</p> : (
          <ul className="space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="rounded border border-slate-200 p-3">
                <div className="flex items-center justify-between"><span className="text-sm text-slate-900">Score {entry.score}</span><StatusBadge tone={getStatusTone("COMPLETED")}>Reviewed</StatusBadge></div>
                <p className="mt-1 text-sm text-slate-600">{entry.comments}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canReview ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Supervisor review panel</h2>
          {!rows.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No feedback records found.</p> : (
            <TableContainer>
              <Table>
                <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-2">Employee</th><th>Reviewer</th><th>Score</th><th>Comments</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="px-4 py-2">{row.employeeId}</td><td>{row.reviewerId}</td><td>{row.score}</td><td>{row.comments}</td><td>{new Date(row.date).toLocaleDateString()}</td><td><button type="button" onClick={() => setEditing(row)} className="rounded bg-slate-800 px-2 py-1 text-xs text-white">Review</button></td></tr>)}</tbody>
              </Table>
            </TableContainer>
          )}
        </section>
      ) : null}

      {editing ? <ReviewModal row={editing} onClose={() => setEditing(null)} onSave={saveReview} /> : null}
    </div>
  );
}

function ReviewModal({ row, onClose, onSave }: { row: FeedbackRow; onClose: () => void; onSave: (feedbackId: string, score: number, comments: string) => Promise<void> }) {
  const [score, setScore] = useState(row.score);
  const [comments, setComments] = useState(row.comments);

  return (
    <Modal title="Review feedback" onClose={onClose}>
      <div className="space-y-3">
        <input value={score} onChange={(e) => setScore(Number(e.target.value))} type="number" min={1} max={10} className="w-full rounded border px-3 py-2 text-sm" />
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" rows={4} />
        <button type="button" onClick={() => void onSave(row.id, score, comments)} className="w-full rounded bg-slate-900 px-3 py-2 text-sm text-white">Save review</button>
      </div>
    </Modal>
  );
}
