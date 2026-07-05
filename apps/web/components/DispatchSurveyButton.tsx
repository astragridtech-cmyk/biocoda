"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Dispatch a field survey for a parcel. Posts to /api/parcels/dispatch (the same
 * endpoint the portfolio uses) rather than a server-action form, so it does not
 * depend on the React server-action form-action types.
 */
export function DispatchSurveyButton({
  parcelId,
  reason,
  disabled,
}: {
  parcelId: string;
  reason: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [dispatched, setDispatched] = useState(disabled);

  async function go() {
    setBusy(true);
    try {
      const res = await fetch("/api/parcels/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parcelId, reason }),
      });
      if (res.ok) {
        setDispatched(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={busy || dispatched}
      className="rounded-md bg-moss px-3 py-1.5 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50"
    >
      {dispatched ? "Survey dispatched" : busy ? "Dispatching…" : "Dispatch field survey"}
    </button>
  );
}
