"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data: Array<{ status: string }>) => setUnreadCount(data.filter((item) => item.status !== "READ").length))
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <Link href="/notifications" className="relative rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      Notifications
      {unreadCount > 0 ? <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">{unreadCount}</span> : null}
    </Link>
  );
}
