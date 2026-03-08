"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateFeedbackForm() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [score, setScore] = useState(5);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        body: JSON.stringify({ comments, employeeId, score }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create feedback.");
      }

      setEmployeeId("");
      setScore(5);
      setComments("");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create feedback.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Create Feedback</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <input
          required
          type="text"
          value={employeeId}
          onChange={(event) => setEmployeeId(event.target.value)}
          placeholder="Employee ID"
          className="border rounded px-3 py-2 text-sm text-slate-900"
        />
        <input
          required
          min={1}
          max={10}
          type="number"
          value={score}
          onChange={(event) => setScore(Number(event.target.value))}
          className="border rounded px-3 py-2 text-sm text-slate-900"
        />
        <input
          required
          type="text"
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder="Comments"
          className="border rounded px-3 py-2 text-sm text-slate-900"
        />
        <button
          disabled={isLoading}
          type="submit"
          className="bg-slate-900 text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          {isLoading ? "Submitting..." : "Create Feedback"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
