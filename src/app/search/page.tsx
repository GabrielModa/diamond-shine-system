"use client";
import { useState } from "react";

type Result = { id: string; entity: string; label: string };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Result[]>([]);

  async function onSearch() {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    setRows(await response.json());
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Search</h1>
      <div className="mb-3 flex gap-2"><input className="border p-2" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="border px-3" onClick={onSearch}>Search</button></div>
      <table className="min-w-full text-sm"><thead><tr><th>Entity</th><th>Label</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id+r.entity}><td>{r.entity}</td><td>{r.label}</td></tr>)}</tbody></table>
    </main>
  );
}
