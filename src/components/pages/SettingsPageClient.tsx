"use client";

import { type FormEvent, useEffect, useState } from "react";

type Row = { key: string; value: string; updatedBy: string };

export function SettingsPageClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [keyValue, setKeyValue] = useState("defaultDepartment");
  const [value, setValue] = useState("Operations");

  const load = () => fetch("/api/settings").then((r) => r.json()).then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: keyValue, value }) });
    load();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <input value={keyValue} onChange={(e) => setKeyValue(e.target.value)} className="rounded border px-3 py-2 text-sm" required />
        <input value={value} onChange={(e) => setValue(e.target.value)} className="rounded border px-3 py-2 text-sm" required />
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Save Setting</button>
      </form>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {rows.map((row) => <p key={row.key} className="border-b py-2 text-sm last:border-0"><span className="font-medium">{row.key}</span>: {row.value}</p>)}
      </div>
    </div>
  );
}
