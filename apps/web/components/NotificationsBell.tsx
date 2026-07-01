"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: "at_risk" | "survey" | "plan" | "digest";
  title: string;
  body: string;
  parcelId: string | null;
  createdAt: string;
  read: boolean;
}

const ICON: Record<Notification["type"], { dot: string; label: string }> = {
  at_risk: { dot: "#8E5BB5", label: "At risk" },
  survey: { dot: "#3B7D3C", label: "Survey" },
  plan: { dot: "#5E5A50", label: "Plan" },
  digest: { dot: "#26405F", label: "Digest" },
};

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setItems(data.notifications ?? []);
        setUnread(data.unread ?? 0);
      }
    } catch {
      // ignore (e.g. DB down)
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAll() {
    await fetch("/api/notifications/read", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    setUnread(0);
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
  }

  async function openItem(n: Notification) {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: n.id }),
    });
    setOpen(false);
    router.push(n.parcelId ? `/parcels/${n.parcelId}` : "/digest");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-md border border-line text-muted hover:bg-panel"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-orchid px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            <button onClick={markAll} className="text-xs text-moss hover:underline">
              Mark all read
            </button>
          </div>
          <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted">You are all caught up.</li>
            )}
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => openItem(n)}
                  className={`block w-full px-4 py-3 text-left hover:bg-panel ${n.read ? "" : "bg-[#F6F9F4]"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: ICON[n.type].dot }} />
                    <span className="flex-1 text-[13px] font-semibold text-ink">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-orchid" />}
                  </div>
                  <p className="mt-0.5 pl-4 text-[11.5px] text-muted">{n.body}</p>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-4 py-2 text-center">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/digest");
              }}
              className="text-xs font-medium text-moss hover:underline"
            >
              View state of portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
