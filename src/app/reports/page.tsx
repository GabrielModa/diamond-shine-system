"use client";
import { useEffect, useState } from "react";

type Row = { id: string; reportKey: string; format: string; status: string };

export default function ReportsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { fetch("/api/reports").then((r) => r.json()).then(setRows).catch(() => setRows([])); }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Reports</h1>
      <table className="min-w-full text-sm"><thead><tr><th>Report</th><th>Format</th><th>Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.reportKey}</td><td>{r.format}</td><td>{r.status}</td></tr>)}</tbody></table>
    </main>
  );
}
