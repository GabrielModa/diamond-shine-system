"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Table, TableContainer } from "@/src/components/ui/Table";

type Row = { id: string; filename: string; mimeType: string; sizeBytes: number; createdAt: string };

export function FilesPageClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filename, setFilename] = useState("");
  const [mimeType, setMimeType] = useState("application/pdf");
  const [sizeBytes, setSizeBytes] = useState(1024);

  const load = () => fetch("/api/files").then((r) => r.json()).then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await fetch("/api/files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename, mimeType, sizeBytes }) });
    setFilename("");
    load();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="filename.ext" className="rounded border px-3 py-2 text-sm" required />
        <input value={mimeType} onChange={(e) => setMimeType(e.target.value)} className="rounded border px-3 py-2 text-sm" required />
        <input value={sizeBytes} onChange={(e) => setSizeBytes(Number(e.target.value))} type="number" min={1} className="rounded border px-3 py-2 text-sm" required />
        <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">Register Upload</button>
      </form>
      <TableContainer>
        <Table>
          <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-2">Name</th><th>Type</th><th>Size</th><th>Created</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id} className="border-t"><td className="px-4 py-2">{r.filename}</td><td>{r.mimeType}</td><td>{r.sizeBytes}</td><td>{new Date(r.createdAt).toLocaleString()}</td></tr>)}</tbody>
        </Table>
      </TableContainer>
    </div>
  );
}
