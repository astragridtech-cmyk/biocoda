/**
 * Status and condition chips, coloured to the BioCoda system: on-track in
 * Meadow Green, at-risk in Orchid (the coda accent), awaiting EO in a neutral.
 */
export function StatusBadge({ status }: { status: "on_track" | "at_risk" | null }) {
  if (status === "at_risk") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#F1EAF7] px-2.5 py-0.5 text-xs font-medium text-orchid">
        ● At risk
      </span>
    );
  }
  if (status === "on_track") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#E4EBDE] px-2.5 py-0.5 text-xs font-medium text-track">
        ● On track
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#EDECE8] px-2.5 py-0.5 text-xs font-medium text-muted">
      ○ Awaiting Earth observation
    </span>
  );
}

export function ConditionPill({ band }: { band: "poor" | "moderate" | "good" }) {
  const map = {
    poor: "bg-[#F0E7E1] text-[#9B6B4F]",
    moderate: "bg-[#EEF0E2] text-[#7C8A4A]",
    good: "bg-[#E4EBDE] text-forest",
  } as const;
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${map[band]}`}>
      {band}
    </span>
  );
}
