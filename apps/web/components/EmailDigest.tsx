"use client";

import { useState } from "react";

export function EmailDigest() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function email() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/digest/send", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const data = await res.json();
      setMsg(res.ok ? data.detail : data.error || "Send failed");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={email}
        disabled={busy}
        className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-leaf disabled:opacity-60"
      >
        {busy ? "Sending…" : "Email this digest"}
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-panel"
      >
        Print / export
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}
