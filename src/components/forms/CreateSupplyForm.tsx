"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateSupplyForm() {
  const router = useRouter();
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [department, setDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/supplies", {
        body: JSON.stringify({ department, item, quantity }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create supply request.");
      }

      setItem("");
      setQuantity(1);
      setDepartment("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to create supply request.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Create Supply Request</h2>
      <div className="grid gap-3 md:grid-cols-4">
        <input
          required
          type="text"
          value={item}
          onChange={(event) => setItem(event.target.value)}
          placeholder="Item"
          className="border rounded px-3 py-2 text-sm text-slate-900"
        />
        <input
          required
          min={1}
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="border rounded px-3 py-2 text-sm text-slate-900"
        />
        <input
          required
          type="text"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          placeholder="Department"
          className="border rounded px-3 py-2 text-sm text-slate-900"
        />
        <button
          disabled={isLoading}
          type="submit"
          className="bg-slate-900 text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          {isLoading ? "Submitting..." : "Create Request"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
