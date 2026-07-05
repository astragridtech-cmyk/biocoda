"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { assessParcel, hashU32, parcelProfile, requiredConditionAt, observedConditionAt, correctedConditionAt, type FieldPoint, type Polygon } from "@biocoda/shared";
import { MapView } from "./MapView";
import { TrajectoryChart } from "./TrajectoryChart";

/** Lean parcel shape passed from the server page. */
export interface PortfolioParcel {
  id: string;
  name: string;
  habitatType: string;
  areaHa: number;
  baselineDate: string;
  geom: Polygon;
  /** Authoritative field verifications on the management timeline. */
  fields?: FieldPoint[];
}

type Kind = "track" | "risk" | "awaiting";

interface Computed {
  p: PortfolioParcel;
  kind: Kind;
  actual: number;
  required: number;
  gap: number;
  code: string;
}

const BASE_YEAR = 2025;
const MANAGEMENT_YEARS = 30;
const TARGET_SCORE = 3;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

const DOT = { track: "#3B7D3C", risk: "#8E5BB5", awaiting: "#9C978B" } as const;
const TINT = { track: "#E4EBDE", risk: "#F1EAF7", awaiting: "#EDECE8" } as const;

const HABITAT_COLOR: Record<string, string> = {
  "Mixed scrub": "#A98E55",
  Reedbed: "#6E8E78",
  "Lowland heathland": "#9B6B4F",
  "Upland heathland": "#8A6A86",
  "Blanket bog": "#6E6248",
  "Species-rich grassland": "#9DAE66",
  "Calcareous grassland": "#C2B26A",
  "Lowland meadow": "#88A05A",
  "Fen meadow": "#88A05A",
  "Wet woodland": "#3E6B57",
  "Native woodland": "#5E7E44",
  "Floodplain wetland": "#6E8E78",
  "Grazing marsh": "#6E8E78",
  Hedgerow: "#9DAE66",
};
function habitatColor(h: string): string {
  return HABITAT_COLOR[h] ?? "#9C978B";
}

// EO recency: how recently a parcel has a usable EO observation. Deterministic
// per parcel (stable across renders); awaiting parcels have no baseline yet.
type Recency = "fresh" | "recent" | "aging" | "stale" | "none";
const RECENCY_COLOR: Record<Recency, string> = {
  fresh: "#2E7D32",
  recent: "#7CB342",
  aging: "#E0A100",
  stale: "#C2410C",
  none: "#9C978B",
};
const RECENCY_LABEL: Record<Recency, string> = {
  fresh: "Fresh (under 1 month)",
  recent: "Recent (1 to 2 months)",
  aging: "Aging (2 to 4 months)",
  stale: "Stale (over 4 months)",
  none: "No Earth observation yet",
};
function eoRecency(c: Computed): Recency {
  if (c.kind === "awaiting") return "none";
  const days = hashU32(`${c.p.id}:eo`) % 210;
  if (days <= 30) return "fresh";
  if (days <= 60) return "recent";
  if (days <= 120) return "aging";
  return "stale";
}

// Field verification coverage. Deterministic per parcel; awaiting parcels are
// unverified by definition (no EO baseline to ground-truth yet).
type Verif = "verified" | "scheduled" | "unverified";
const VERIF_COLOR: Record<Verif, string> = {
  verified: "#2E7D32",
  scheduled: "#2563A8",
  unverified: "#9C978B",
};
const VERIF_LABEL: Record<Verif, string> = {
  verified: "Field verified",
  scheduled: "Survey scheduled",
  unverified: "Unverified",
};
function verification(c: Computed): Verif {
  if (c.kind === "awaiting") return "unverified";
  const v = hashU32(`${c.p.id}:ver`) % 100;
  if (v < 22) return "verified";
  if (v < 42) return "scheduled";
  return "unverified";
}

/** Per-parcel colour for the active map layer. */
function layerColor(c: Computed, layer: string): string {
  switch (layer) {
    case "Habitat":
      return habitatColor(c.p.habitatType);
    case "Earth observation recency":
      return RECENCY_COLOR[eoRecency(c)];
    case "Verification":
      return VERIF_COLOR[verification(c)];
    default:
      return DOT[c.kind];
  }
}

/** Legend entries for the active map layer, reflecting what is currently shown. */
function buildLegend(
  layer: string,
  visible: Computed[],
  shownKinds: Kind[],
): { label: string; color: string }[] {
  if (layer === "Habitat") {
    const seen = new Map<string, string>();
    for (const r of visible) {
      if (!seen.has(r.p.habitatType)) seen.set(r.p.habitatType, habitatColor(r.p.habitatType));
    }
    return [...seen.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, color]) => ({ label, color }));
  }
  if (layer === "Earth observation recency") {
    const items = (["fresh", "recent", "aging", "stale"] as Recency[]).map((r) => ({
      label: RECENCY_LABEL[r],
      color: RECENCY_COLOR[r],
    }));
    if (visible.some((r) => r.kind === "awaiting")) {
      items.push({ label: RECENCY_LABEL.none, color: RECENCY_COLOR.none });
    }
    return items;
  }
  if (layer === "Verification") {
    return (["verified", "scheduled", "unverified"] as Verif[]).map((v) => ({
      label: VERIF_LABEL[v],
      color: VERIF_COLOR[v],
    }));
  }
  const label: Record<Kind, string> = { track: "On track", risk: "At risk", awaiting: "Awaiting Earth observation" };
  return shownKinds.map((k) => ({ label: label[k], color: DOT[k] }));
}

function compute(p: PortfolioParcel, year: number): Computed {
  return { p, ...assessParcel(p.id, year, p.fields ?? []) };
}

type SortKey = "ref" | "site" | "habitat" | "area" | "condition" | "status";

export function PortfolioApp({ parcels, role }: { parcels: PortfolioParcel[]; role: string }) {
  const [year, setYear] = useState(9);
  const [view, setView] = useState<"portfolio" | "map" | "timeline">("portfolio");
  const [mapLayer, setMapLayer] = useState("Condition");
  const [filter, setFilter] = useState({ track: true, risk: true, awaiting: true });
  const [playing, setPlaying] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [sortKey, setSortKey] = useState<SortKey>("condition");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<string | null>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    playRef.current = setInterval(() => {
      setYear((y) => (y >= MANAGEMENT_YEARS ? (setPlaying(false), y) : y + 1));
    }, 420);
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [playing]);

  const rows = useMemo(() => parcels.map((p) => compute(p, year)), [parcels, year]);

  const stats = useMemo(() => {
    let nT = 0, nR = 0, nA = 0, haAll = 0, haT = 0, haR = 0, scoreSum = 0, scored = 0;
    for (const r of rows) {
      haAll += r.p.areaHa;
      if (r.kind === "track") { nT++; haT += r.p.areaHa; scoreSum += r.actual; scored++; }
      else if (r.kind === "risk") { nR++; haR += r.p.areaHa; scoreSum += r.actual; scored++; }
      else nA++;
    }
    return {
      nT, nR, nA, haAll, haT, haR,
      total: rows.length,
      mean: scored ? scoreSum / scored : 0,
      pctTrack: rows.length ? Math.round((nT / rows.length) * 100) : 0,
    };
  }, [rows]);

  const shownKinds = (["track", "risk", "awaiting"] as Kind[]).filter((k) => filter[k]);
  const visible = rows.filter((r) => filter[r.kind]);

  const mapParcels = visible.map((r) => ({
    id: r.p.id,
    name: r.p.name,
    color: layerColor(r, mapLayer),
    geom: r.p.geom,
  }));

  const register = useMemo(
    () => visible.filter((r) => r.kind !== "awaiting").sort((a, b) => a.gap - b.gap),
    [visible],
  );

  const tableRows = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const key = (r: Computed): number | string => {
      switch (sortKey) {
        case "ref": return r.code;
        case "site": return r.p.name;
        case "habitat": return r.p.habitatType;
        case "area": return r.p.areaHa;
        case "condition": return r.kind === "awaiting" ? -1 : r.actual;
        case "status": return r.kind === "risk" ? 0 : r.kind === "awaiting" ? 1 : 2;
      }
    };
    return [...visible].sort((a, b) => {
      const ka = key(a), kb = key(b);
      return (ka < kb ? -1 : ka > kb ? 1 : 0) * dir;
    });
  }, [visible, sortKey, sortDir]);

  function toggle(k: Kind) {
    setFilter((f) => ({ ...f, [k]: !f[k] }));
  }
  const allOn = filter.track && filter.risk && filter.awaiting;
  const selectedRow = selected ? rows.find((r) => r.p.id === selected) ?? null : null;
  const registerTitle =
    role === "ecologist" ? "Survey queue" : role === "developer" ? "Intervene now" : "Risk register";

  return (
    <div className="space-y-4">
      {/* View segmented + lens */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          value={view}
          options={[
            { value: "portfolio", label: "Portfolio" },
            { value: "map", label: "Map" },
            { value: "timeline", label: "Timeline" },
          ]}
          onChange={(v) => setView(v as typeof view)}
        />
        <span className="text-xs text-muted">
          Lens · {roleLabel(role)}: evidence &amp; 30-year risk
        </span>
      </div>

      {/* Management-year card */}
      <div className="card flex flex-wrap items-center gap-5 px-5 py-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Management year
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[34px] font-bold tabular-nums leading-none text-ink">
            {String(year).padStart(2, "0")}
          </span>
          <span className="text-sm text-muted">/ {MANAGEMENT_YEARS} · {BASE_YEAR + year}</span>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play the 30-year arc"}
          className="grid h-[42px] w-[42px] place-items-center rounded-full border border-line bg-panel text-forest hover:bg-field"
        >
          <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span>
        </button>
        <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
          <input
            type="range"
            min={0}
            max={MANAGEMENT_YEARS}
            value={year}
            onChange={(e) => { setPlaying(false); setYear(Number(e.target.value)); }}
            aria-label="Management year"
            aria-valuetext={`Year ${year}, ${BASE_YEAR + year}`}
            className="bc-scrubber"
            style={{
              background: `linear-gradient(90deg,#8E5BB5 0%,#8E5BB5 ${(year / MANAGEMENT_YEARS) * 100}%,#DCE5D7 ${(year / MANAGEMENT_YEARS) * 100}%,#DCE5D7 100%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-muted">
            <span>Y0</span><span>Y5</span><span>Y10</span><span>Y15</span><span>Y20</span><span>Y25</span>
            <span className="font-medium text-orchid">Target</span>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Filter</span>
        <Chip all active={allOn} onClick={() => setFilter({ track: true, risk: true, awaiting: true })}>
          All parcels <Count active={allOn}>{stats.total}</Count>
        </Chip>
        <Chip kind="track" active={filter.track} onClick={() => toggle("track")}>
          On track <Count>{stats.nT}</Count>
        </Chip>
        <Chip kind="risk" active={filter.risk} onClick={() => toggle("risk")}>
          At risk <Count>{stats.nR}</Count>
        </Chip>
        <Chip kind="awaiting" active={filter.awaiting} onClick={() => toggle("awaiting")}>
          Awaiting Earth observation <Count>{stats.nA}</Count>
        </Chip>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
        <Kpi label="On track" value={stats.nT} sub={`${stats.pctTrack}% of portfolio · ${Math.round(stats.haT)} ha`} accent="#3B7D3C" active={filter.track} onClick={() => toggle("track")} />
        <Kpi label="At risk" value={stats.nR} sub={`${Math.round(stats.haR)} ha off trajectory`} accent="#8E5BB5" active={filter.risk} onClick={() => toggle("risk")} />
        <Kpi label="Awaiting Earth observation" value={stats.nA} sub="no baseline captured yet" accent="#9C978B" active={filter.awaiting} onClick={() => toggle("awaiting")} />
        <Kpi label="Portfolio condition" value={stats.mean.toFixed(2)} sub={`mean score · target ${TARGET_SCORE.toFixed(2)}`} />
        <Kpi label="Under management" value={Math.round(stats.haAll)} unit="ha" sub={`${stats.total} parcels · 30-year term`} />
      </div>

      {view === "timeline" ? (
        <TimelineView parcels={parcels} year={year} />
      ) : (
        <>
          <div className={view === "map" ? "" : "grid gap-4 lg:grid-cols-5"}>
            {/* Map */}
            <div className={`card overflow-hidden ${view === "map" ? "" : "lg:col-span-3"}`}>
              <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-ink">Portfolio map</div>
                  <div className="text-[11px] text-muted">{legendForLayer(mapLayer)}</div>
                </div>
                <Segmented
                  small
                  value={mapLayer}
                  options={[
                    { value: "Condition", label: "Condition" },
                    { value: "Habitat", label: "Habitat" },
                    { value: "Earth observation recency", label: "Earth observation" },
                    { value: "Verification", label: "Verification" },
                  ]}
                  onChange={setMapLayer}
                />
              </div>
              <MapView parcels={mapParcels} onSelect={setSelected} />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line px-4 py-2 text-[11px] text-muted">
                {buildLegend(mapLayer, visible, shownKinds).map((it) => (
                  <span key={it.label} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: it.color }} />
                    {it.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Risk register */}
            {view !== "map" && (
              <div className="card flex flex-col lg:col-span-2">
                <div className="border-b border-line px-4 py-3">
                  <div className="text-sm font-semibold text-ink">{registerTitle}</div>
                  <div className="text-[11px] text-muted">Evidence priorities, by severity</div>
                </div>
                <ul className="max-h-[548px] divide-y divide-line overflow-y-auto">
                  {register.map((r) => (
                    <li key={r.p.id}>
                      <button onClick={() => setSelected(r.p.id)} className="block w-full px-4 py-3 text-left hover:bg-panel">
                        <div className="flex items-center justify-between">
                          <span className="text-[13.5px] font-semibold text-ink">{r.p.name}</span>
                          <span className="text-[11px] tabular-nums text-muted">{r.code}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted">{r.p.habitatType} · {r.p.areaHa} ha</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-field">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(6, (Math.abs(Math.min(0, r.gap)) / 1.5) * 100))}%`,
                                background: r.kind === "risk" ? "linear-gradient(90deg,#B98AD8,#8E5BB5)" : "linear-gradient(90deg,#6FAE63,#2F6B30)",
                              }}
                            />
                          </div>
                          <span className="w-12 text-right text-[11px] font-semibold tabular-nums" style={{ color: r.gap < 0 ? DOT.risk : "#5E5A50" }}>
                            {r.gap >= 0 ? "+" : ""}{r.gap.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                  {register.length === 0 && (
                    <li className="px-4 py-10 text-center text-sm text-muted">No parcels in this filter.</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Parcels table (Portfolio view) */}
          {view === "portfolio" && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="text-sm font-semibold text-ink">Parcels ({tableRows.length})</div>
                <Segmented
                  small
                  value={density}
                  options={[
                    { value: "comfortable", label: "Comfortable" },
                    { value: "compact", label: "Compact" },
                  ]}
                  onChange={(v) => setDensity(v as typeof density)}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-panel text-left text-[10px] uppercase tracking-[0.07em] text-muted">
                      <Th k="ref" cur={sortKey} dir={sortDir} set={setSortKey} flip={setSortDir}>Reference</Th>
                      <Th k="site" cur={sortKey} dir={sortDir} set={setSortKey} flip={setSortDir}>Site</Th>
                      <Th k="habitat" cur={sortKey} dir={sortDir} set={setSortKey} flip={setSortDir}>Habitat</Th>
                      <Th k="area" cur={sortKey} dir={sortDir} set={setSortKey} flip={setSortDir} right>Area</Th>
                      <Th k="condition" cur={sortKey} dir={sortDir} set={setSortKey} flip={setSortDir}>Condition</Th>
                      <Th k="status" cur={sortKey} dir={sortDir} set={setSortKey} flip={setSortDir}>Status</Th>
                      <th scope="col" className="px-4 py-2">Earth observation</th>
                      <th scope="col" className="px-4 py-2">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line2">
                    {tableRows.map((r) => {
                      const pad = density === "compact" ? "py-[7px]" : "py-[13px]";
                      return (
                        <tr
                          key={r.p.id}
                          onClick={() => setSelected(r.p.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(r.p.id); }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`Open ${r.p.name} details`}
                          className={`cursor-pointer hover:bg-panel focus:bg-panel ${selected === r.p.id ? "bg-panel" : ""}`}
                        >
                          <td className={`px-4 ${pad} text-[11px] tabular-nums text-muted`}>{r.code}</td>
                          <td className={`px-4 ${pad} font-medium text-ink`}>{r.p.name}</td>
                          <td className={`px-4 ${pad} text-muted`}>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: habitatColor(r.p.habitatType) }} />
                              {r.p.habitatType}
                            </span>
                          </td>
                          <td className={`px-4 ${pad} text-right tabular-nums text-muted`}>{r.p.areaHa}</td>
                          <td className={`px-4 ${pad}`}>
                            {r.kind === "awaiting" ? (
                              <span className="text-muted">-</span>
                            ) : (
                              <span className="inline-flex items-center gap-2">
                                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-field">
                                  <span className="block h-full rounded-full" style={{ width: `${(r.actual / 3) * 100}%`, background: DOT[r.kind] }} />
                                </span>
                                <span className="tabular-nums text-muted">{r.actual.toFixed(2)}</span>
                              </span>
                            )}
                          </td>
                          <td className={`px-4 ${pad}`}><StatusPill kind={r.kind} /></td>
                          <td className={`px-4 ${pad} text-[11px] text-muted`}>{r.kind === "awaiting" ? "-" : `Y${year}`}</td>
                          <td className={`px-4 ${pad} text-[11px]`}>
                            {(() => {
                              const v = verification(r);
                              if (v === "unverified") return <span className="text-muted">-</span>;
                              return (
                                <span className="inline-flex items-center gap-1.5 text-muted">
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: VERIF_COLOR[v] }} />
                                  {v === "verified" ? "Verified" : "Scheduled"}
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {selectedRow && (
        <ParcelDrawer row={selectedRow} year={year} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── building blocks ─────────────────────────────────────────────────────────

function Segmented({
  value,
  options,
  onChange,
  small,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  small?: boolean;
}) {
  return (
    <div className="inline-flex rounded-[11px] border border-line bg-white p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-lg ${small ? "px-2.5 py-1 text-[11px]" : "px-4 py-1.5 text-[13.5px]"} font-medium transition ${
            value === o.value ? "bg-forest text-white" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Chip({
  active,
  kind,
  all,
  onClick,
  children,
}: {
  active: boolean;
  kind?: Kind;
  all?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const style: React.CSSProperties = {};
  if (active && all) {
    style.background = "#18301A";
    style.color = "#EFF3EC";
    style.borderColor = "#18301A";
  } else if (active && kind) {
    style.background = TINT[kind];
    style.borderColor = DOT[kind];
    style.color = "#18301A";
  }
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] text-[12.5px] font-medium transition ${
        active ? "" : "border-line bg-transparent text-muted"
      }`}
      style={style}
    >
      {kind && <span className="h-2 w-2 rounded-full" style={{ background: DOT[kind], opacity: active ? 1 : 0.45 }} />}
      {children}
    </button>
  );
}

function Count({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] tabular-nums"
      style={{ background: active ? "rgba(255,255,255,0.18)" : "#E8EEE4", color: active ? "inherit" : "#5E5A50" }}
    >
      {children}
    </span>
  );
}

function Kpi({
  label,
  value,
  sub,
  unit,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  sub: string;
  unit?: string;
  accent?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card px-[18px] pb-[15px] pt-[17px] ${onClick ? "cursor-pointer transition hover:border-forest/40" : ""}`}
      style={active ? { boxShadow: "0 0 0 1px #18301A" } : undefined}
      onClick={onClick}
      {...(onClick
        ? {
            role: "button" as const,
            tabIndex: 0,
            "aria-pressed": active,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
            },
          }
        : {})}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-[40px] font-bold tabular-nums leading-none" style={{ color: accent ?? "#18301A", letterSpacing: "-0.02em" }}>
          {value}
        </span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      <div className="mt-1.5 text-[11.5px] text-muted">{sub}</div>
    </div>
  );
}

function StatusPill({ kind }: { kind: Kind }) {
  const label = kind === "track" ? "On track" : kind === "risk" ? "At risk" : "Awaiting Earth observation";
  const textColor = kind === "track" ? "#2F6B30" : kind === "risk" ? "#6D3D9A" : "#5E5A50";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
      style={{ background: TINT[kind], color: textColor }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[kind] }} />
      {label}
    </span>
  );
}

function Th({
  k,
  cur,
  dir,
  set,
  flip,
  right,
  children,
}: {
  k: SortKey;
  cur: SortKey;
  dir: "asc" | "desc";
  set: (k: SortKey) => void;
  flip: (d: "asc" | "desc") => void;
  right?: boolean;
  children: React.ReactNode;
}) {
  const activeCol = cur === k;
  return (
    <th
      scope="col"
      aria-sort={activeCol ? (dir === "asc" ? "ascending" : "descending") : undefined}
      className={`px-4 py-2 ${right ? "text-right" : ""}`}
    >
      <button
        type="button"
        onClick={() => (activeCol ? flip(dir === "asc" ? "desc" : "asc") : (set(k), flip("asc")))}
        className={`inline-flex select-none items-center gap-1 uppercase tracking-[inherit] ${right ? "flex-row-reverse" : ""}`}
      >
        {children}
        {activeCol && <span aria-hidden="true">{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

function ParcelDrawer({ row, year, onClose }: { row: Computed; year: number; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const { p, kind } = row;
  const prof = parcelProfile(p.id);
  const t = { baselineCondition: prof.baselineCondition, targetCondition: prof.targetCondition, targetYear: prof.byYear };
  const baseline = new Date(`${p.baselineDate}T00:00:00Z`).getTime();

  const requiredCurve = Array.from({ length: MANAGEMENT_YEARS + 1 }, (_, yy) => ({
    year: yy,
    required: requiredConditionAt(t, yy),
  }));
  const eoSeries =
    kind === "awaiting"
      ? []
      : Array.from({ length: year + 1 }, (_, yy) => ({
          capturedAt: new Date(baseline + yy * MS_PER_YEAR).toISOString(),
          value: correctedConditionAt((yr) => observedConditionAt(p.id, yr), yy, p.fields ?? []),
        }));

  async function dispatch() {
    setBusy(true);
    try {
      const res = await fetch("/api/parcels/dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parcelId: p.id }),
      });
      if (res.ok) setDispatched(true);
    } finally {
      setBusy(false);
    }
  }

  // Close on Escape (WCAG 2.1.1: keyboard dismissal of the dialog).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="absolute inset-0" style={{ background: "rgba(14,26,18,0.42)" }} onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[540px] max-w-[94vw] overflow-y-auto bg-canvas shadow-2xl">
        <div className="flex items-start justify-between border-b border-line bg-white px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <StatusPill kind={kind} />
              <span className="text-[11px] tabular-nums text-muted">{row.code}</span>
            </div>
            <h2 id="drawer-title" className="mt-1.5 text-2xl font-bold text-ink">{p.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-[34px] w-[34px] place-items-center rounded-md border border-line text-muted hover:bg-panel"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-3 gap-px bg-line">
          {[
            ["Habitat", p.habitatType],
            ["Area", `${p.areaHa} ha`],
            ["Condition now", kind === "awaiting" ? "-" : row.actual.toFixed(2)],
            ["Required now", kind === "awaiting" ? "-" : row.required.toFixed(2)],
            ["Earth observation recency", kind === "awaiting" ? "Awaiting baseline" : `Year ${year}`],
            ["Last verified", "Not yet"],
          ].map(([k, v]) => (
            <div key={k} className="bg-white px-5 py-3">
              <div className="text-[10px] uppercase tracking-wide text-muted">{k}</div>
              <div className="mt-0.5 text-sm text-ink">{v}</div>
            </div>
          ))}
        </div>

        {/* Trajectory */}
        <div className="p-5">
          <div className="mb-2 text-sm font-semibold text-ink">30-year trajectory</div>
          {kind === "awaiting" ? (
            <div className="card p-8 text-center text-sm text-muted">
              No Earth observation baseline captured yet. Dispatch a field survey to begin monitoring.
            </div>
          ) : (
            <div className="card p-3">
              <TrajectoryChart
                baselineDate={p.baselineDate}
                byYear={prof.byYear}
                currentYear={year}
                status={kind === "risk" ? "at_risk" : "on_track"}
                requiredCurve={requiredCurve}
                eoSeries={eoSeries}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-line bg-white px-6 py-4">
          <button
            onClick={dispatch}
            disabled={busy || dispatched}
            className="flex-1 rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf disabled:opacity-60"
          >
            {dispatched ? "Survey dispatched" : busy ? "Dispatching…" : "Dispatch field survey"}
          </button>
          <a
            href={`/parcels/${p.id}#progress`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-moss px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-leaf"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="7" height="16" rx="1.3" stroke="currentColor" strokeWidth={2} />
              <rect x="14" y="4" width="7" height="16" rx="1.3" stroke="currentColor" strokeWidth={2} />
            </svg>
            See progress
          </a>
          <a
            href={`/api/reports?parcelId=${p.id}`}
            className="flex-1 rounded-md border border-line px-4 py-2.5 text-center text-sm font-medium text-ink hover:bg-panel"
          >
            Export evidence pack
          </a>
        </div>
      </div>
    </div>
  );
}

function TimelineView({ parcels, year }: { parcels: PortfolioParcel[]; year: number }) {
  const W = 900, H = 280, PAD = { l: 40, r: 20, t: 20, b: 30 };
  const series = useMemo(() => {
    const out: { y: number; mean: number; risk: number }[] = [];
    for (let yy = 0; yy <= MANAGEMENT_YEARS; yy++) {
      let s = 0, n = 0, risk = 0;
      for (const p of parcels) {
        if (hashU32(p.id) % 7 === 0) continue;
        const c = compute(p, yy);
        s += c.actual; n++;
        if (c.kind === "risk") risk++;
      }
      out.push({ y: yy, mean: n ? s / n : 0, risk });
    }
    return out;
  }, [parcels]);
  const x = (yy: number) => PAD.l + (yy / MANAGEMENT_YEARS) * (W - PAD.l - PAD.r);
  const yv = (v: number) => PAD.t + (1 - v / 3) * (H - PAD.t - PAD.b);
  const pts = series.map((d) => ({ x: x(d.y), y: yv(d.mean) }));
  const line = smoothPath(pts);
  const area = pts.length
    ? `${line} L${pts[pts.length - 1]!.x.toFixed(1)},${yv(0).toFixed(1)} L${pts[0]!.x.toFixed(1)},${yv(0).toFixed(1)} Z`
    : "";

  return (
    <div className="card p-4">
      <div className="mb-1 text-sm font-semibold text-ink">Portfolio condition over the management period</div>
      <div className="mb-3 text-[11px] text-muted">Mean Earth observation condition score across all monitored parcels, year 0 to 30.</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Line chart of the mean condition score across all monitored parcels from year 0 to year 30.">
        <defs>
          <linearGradient id="tlArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B7D3C" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#3B7D3C" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect x={PAD.l} y={yv(3)} width={W - PAD.l - PAD.r} height={yv(2) - yv(3)} fill="#E9F0E4" />
        <rect x={PAD.l} y={yv(2)} width={W - PAD.l - PAD.r} height={yv(1) - yv(2)} fill="#F4F5F1" />
        <rect x={PAD.l} y={yv(1)} width={W - PAD.l - PAD.r} height={yv(0) - yv(1)} fill="#F7EFEA" />
        {[1, 2, 3].map((s) => (
          <g key={s}>
            <line x1={PAD.l} x2={W - PAD.r} y1={yv(s)} y2={yv(s)} stroke="#DCE5D7" />
            <text x={8} y={yv(s) - 4} fontSize="10" fill="#5E5A50">{s === 1 ? "Poor" : s === 2 ? "Moderate" : "Good"}</text>
          </g>
        ))}
        {area && <path d={area} fill="url(#tlArea)" />}
        <path d={line} fill="none" stroke="#3B7D3C" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={x(year)} x2={x(year)} y1={PAD.t} y2={H - PAD.b} stroke="#8E5BB5" strokeWidth={1.25} strokeDasharray="3 3" />
        <circle cx={x(year)} cy={yv(series[year]?.mean ?? 0)} r={4.5} fill="#8E5BB5" stroke="#fff" strokeWidth={1.5} />
        <text x={x(year) + 6} y={PAD.t + 10} fontSize="10" fill="#8E5BB5">Now · Y{year}</text>
        {[0, 5, 10, 15, 20, 25, 30].map((yy) => (
          <text key={yy} x={x(yy)} y={H - 8} fontSize="10" fill="#9C978B" textAnchor="middle">Y{yy}</text>
        ))}
      </svg>
    </div>
  );
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0]!.x},${pts[0]!.y}`;
  let d = `M${pts[0]!.x.toFixed(1)},${pts[0]!.y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function roleLabel(role: string): string {
  return (
    { responsible_body: "Responsible body", lpa: "LPA ecologist", developer: "Developer", ecologist: "Field ecologist" }[role] ??
    "Responsible body"
  );
}

function legendForLayer(layer: string): string {
  return (
    {
      Condition: "Condition status: on-track, at-risk, awaiting Earth observation",
      Habitat: "Habitat type across the portfolio",
      "Earth observation recency": "Most recent Earth observation per parcel",
      Verification: "Field verification coverage",
    }[layer] ?? "Condition status"
  );
}
