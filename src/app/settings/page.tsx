"use client";
import { useEffect, useState } from "react";

type Row = { key: string; value: string; updatedBy: string };

export default function SettingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { fetch("/api/settings").then((r) => r.json()).then(setRows).catch(() => setRows([])); }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <table className="min-w-full text-sm"><thead><tr><th>Key</th><th>Value</th><th>Updated by</th></tr></thead><tbody>{rows.map((r) => <tr key={r.key}><td>{r.key}</td><td>{r.value}</td><td>{r.updatedBy}</td></tr>)}</tbody></table>
    </main>
  );
}
