"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { readApiError } from "./page-state.utils";

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

  useEffect(() => {
    void load();
  }, []);

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
    <div className="space-y-4">
      {canReview ? (
        <form onSubmit={submitFeedback} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Create performance feedback</h2>
          <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Employee ID" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
          <input value={score} onChange={(e) => setScore(Number(e.target.value))} type="number" min={1} max={10} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Review comments" rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required />
          <button className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Submit feedback</button>
        </form>
      ) : null}

      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading feedback...</p> : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Feedback history</h2>
        {!history.length ? <p className="text-sm text-slate-500">No feedback history available.</p> : (
          <ul className="space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">Score {entry.score}</p>
                  <StatusBadge tone="success">Reviewed</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{entry.comments}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canReview ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">Supervisor review queue</h2>
          {!rows.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No feedback records found.</p> : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Employee {row.employeeId}</p>
                  <p className="text-xs text-slate-600">Reviewer {row.reviewerId}</p>
                  <p className="mt-2 text-sm text-slate-700">{row.comments}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge tone="info">Score {row.score}</StatusBadge>
                    <button type="button" onClick={() => setEditing(row)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white">Edit review</button>
                  </div>
                </li>
              ))}
            </ul>
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
    <Modal title="Edit feedback review" onClose={onClose}>
      <div className="space-y-3">
        <input value={score} onChange={(e) => setScore(Number(e.target.value))} type="number" min={1} max={10} className="w-full rounded-lg border px-3 py-2 text-sm" />
        <textarea value={comments} onChange={(e) => setComments(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" rows={4} />
        <button type="button" onClick={() => void onSave(row.id, score, comments)} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">Save review</button>
      </div>
    </Modal>
  );
}
