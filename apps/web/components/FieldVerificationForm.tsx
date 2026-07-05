"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Band = "poor" | "moderate" | "good";

const BANDS: { value: Band; label: string; color: string }[] = [
  { value: "poor", label: "Poor", color: "#A8420E" },
  { value: "moderate", label: "Moderate", color: "#6D3D9A" },
  { value: "good", label: "Good", color: "#2F6B30" },
];

/**
 * Ecologist field-verification form. Works on any device: on a phone or iPad the
 * browser Geolocation prompt captures the on-site position. Submitting records
 * an authoritative verification that recalibrates the parcel's trajectory.
 */
export function FieldVerificationForm({ parcelId }: { parcelId: string }) {
  const router = useRouter();
  const [condition, setCondition] = useState<Band | null>(null);
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function captureLocation() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("This device cannot provide a location. You can still file without it.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Location was not granted. You can still file; the record anchors to the parcel.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!condition) return setError("Choose the condition you assessed on site.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/verifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parcelId, condition, notes, ...(coords ?? {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not file the verification.");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-md border border-forest/40 bg-[#E4EBDE] px-4 py-3 text-sm text-track">
        Verification filed. The parcel status and trajectory now reflect your assessment.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <div id="fv-cond-label" className="mb-1.5 text-xs font-medium text-ink">Condition assessed on site</div>
        <div role="radiogroup" aria-labelledby="fv-cond-label" className="grid grid-cols-3 gap-2">
          {BANDS.map((b) => {
            const active = condition === b.value;
            return (
              <button
                key={b.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCondition(b.value)}
                className="rounded-md border px-3 py-2.5 text-sm font-medium"
                style={
                  active
                    ? { background: b.color, color: "#fff", borderColor: b.color, boxShadow: "inset 0 0 0 2px #fff, 0 0 0 2px " + b.color }
                    : { borderColor: "#B4BCA8", color: b.color }
                }
              >
                {active ? "✓ " : ""}{b.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block text-xs font-medium text-ink">
        Notes (condition criteria, evidence)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
          placeholder="Sward height, species present, bare ground, signs of management…"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={captureLocation}
          disabled={locating}
          className="rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-panel disabled:opacity-50"
        >
          {locating ? "Locating…" : coords ? "Update my location" : "Use my location"}
        </button>
        {coords && (
          <span className="text-xs text-muted">
            <span aria-hidden="true">📍</span> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-orchid/40 bg-[#F1EAF7] px-3 py-2 text-sm text-risk">{error}</div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-moss px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50 sm:w-auto"
      >
        {busy ? "Filing…" : "File field verification"}
      </button>
    </form>
  );
}
