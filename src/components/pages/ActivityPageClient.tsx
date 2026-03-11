"use client";

import { useEffect, useState } from "react";
import { ActivityTimeline } from "@/src/components/activity/ActivityTimeline";

type ActivityEntry = { id: string; action: string; entity: string; createdAt: string };

export function ActivityPageClient() {
  const [rows, setRows] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    fetch("/api/activity").then((res) => res.json()).then(setRows).catch(() => setRows([]));
  }, []);

  return <ActivityTimeline items={rows} />;
}
