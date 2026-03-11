"use client";

import { useEffect, useState } from "react";
import { ActivityTimeline } from "@/src/components/activity/ActivityTimeline";

type ActivityEntry = { id: string; action: string; entity: string; createdAt: string };

export function ActivityPageClient() {
  const [rows, setRows] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((res) => res.json())
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading activity...</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Timeline of supply actions, feedback reviews, and user activity.</p>
      <ActivityTimeline items={rows} />
    </div>
  );
}
