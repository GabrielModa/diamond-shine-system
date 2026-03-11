"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type NotificationPreview = {
  id: string;
  title: string;
  message: string;
  status: "QUEUED" | "READ" | "SENT";
  createdAt: string;
};

export function NotificationBell() {
  const [items, setItems] = useState<NotificationPreview[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = () => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data: NotificationPreview[]) => setItems(data))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = useMemo(() => items.filter((item) => item.status !== "READ").length, [items]);
  const preview = items.slice(0, 4);

  return (
    <div className="relative" ref={wrapperRef}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="relative rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        🔔
        {unreadCount > 0 ? <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">{unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <Link href="/notifications" className="text-xs text-blue-700 hover:underline" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          {!preview.length ? (
            <p className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">No recent notifications.</p>
          ) : (
            <ul className="space-y-2">
              {preview.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 p-2">
                  <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
