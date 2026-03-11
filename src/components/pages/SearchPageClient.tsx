"use client";

import { useMemo, useState } from "react";

type Result = { id: string; entity: string; label: string };

export function SearchPageClient() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Result[]>([]);

  async function onSearch() {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    setRows(await response.json());
  }

  const grouped = useMemo(() => rows.reduce<Record<string, Result[]>>((acc, row) => {
    acc[row.entity] = [...(acc[row.entity] ?? []), row];
    return acc;
  }, {}), [rows]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input className="w-full rounded border px-3 py-2 text-sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users, feedback, supplies..." />
        <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white" onClick={onSearch}>Search</button>
      </div>
      {Object.entries(grouped).map(([entity, entityRows]) => (
        <section key={entity} className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">{entity}</h2>
          <ul className="space-y-2">{entityRows.map((r) => <li key={r.id} className="text-sm text-slate-800">{r.label}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}
