"use client";
import { useEffect, useState } from "react";

type Row = { id: string; filename: string; mimeType: string; sizeBytes: number };

export default function FilesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    fetch("/api/files").then((r) => r.json()).then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Files</h1>
      <table className="min-w-full text-sm"><thead><tr><th>Name</th><th>Type</th><th>Size</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.filename}</td><td>{r.mimeType}</td><td>{r.sizeBytes}</td></tr>)}</tbody></table>
    </main>
  );
}
