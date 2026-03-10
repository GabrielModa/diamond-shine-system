"use client";

import { useEffect, useState } from "react";

type ActivityEntry = { id: string; action: string; entity: string; createdAt: string };

export default function ActivityPage() {
  const [rows, setRows] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    fetch("/api/activity").then((res) => res.json()).then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Activity</h1>
      <table className="min-w-full text-sm">
        <thead><tr><th>Action</th><th>Entity</th><th>Date</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}><td>{row.action}</td><td>{row.entity}</td><td>{new Date(row.createdAt).toLocaleString()}</td></tr>)}</tbody>
      </table>
    </main>
  );
}
