"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import Link from "next/link";

type Notification = {
  id: number;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/user/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.data?.notifications ?? []);
      setUnreadCount(data.data?.unreadCount ?? 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/user/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    setUnreadCount(0);
  };

  const markOne = async (id: number) => {
    await fetch("/api/user/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        id="header-notifications"
        className="header-icon-btn relative rounded-full p-2 transition-all duration-200"
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent-glow)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-80 overflow-hidden rounded-2xl shadow-2xl z-50"
          style={{
            background: "rgba(13,13,26,0.97)",
            border: "1px solid rgba(139,92,246,0.2)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(139,92,246,0.12)" }}>
            <span className="text-sm font-bold text-white">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-accent hover:text-white transition-colors">
                  <CheckCheck className="size-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="size-8 mb-2 opacity-20" />
                <p className="text-xs text-white/40">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className="group flex items-start gap-3 px-4 py-3 transition-colors"
                  style={{ background: n.read ? "transparent" : "rgba(139,92,246,0.06)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  {!n.read && (
                    <div className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent-glow)" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    {n.href ? (
                      <Link href={n.href} onClick={() => { markOne(n.id); setOpen(false); }} className="block">
                        <p className="text-xs font-semibold text-white line-clamp-1">{n.title}</p>
                        <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{n.body}</p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-white line-clamp-1">{n.title}</p>
                        <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{n.body}</p>
                      </>
                    )}
                    <p className="mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.read && (
                    <button onClick={() => markOne(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Check className="size-3.5 text-accent" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
