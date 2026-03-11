"use client";

import { type FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/src/components/ui/StatusBadge";

type Row = { id: string; reportKey: string; format: string; status: string; createdAt: string };

export function ReportsPageClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [reportKey, setReportKey] = useState("supply-summary");
  const [format, setFormat] = useState("CSV");

  const load = () => fetch("/api/reports").then((r) => r.json()).then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportKey, format }) });
    load();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <input value={reportKey} onChange={(e) => setReportKey(e.target.value)} className="rounded border px-3 py-2 text-sm" required />
        <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded border px-3 py-2 text-sm"><option>CSV</option><option>JSON</option><option>PDF</option></select>
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Generate Report</button>
      </form>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div><p className="font-medium text-slate-900">{r.reportKey}</p><p className="text-xs text-slate-500">{r.format} • {new Date(r.createdAt).toLocaleString()}</p></div>
            <div className="flex items-center gap-2"><StatusBadge tone={r.status === "GENERATED" ? "success" : "warning"}>{r.status}</StatusBadge><button className="rounded border border-slate-300 px-3 py-1 text-xs">Download</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
