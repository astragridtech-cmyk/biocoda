"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Polygon } from "@biocoda/shared";

type BBox = [number, number, number, number]; // [w, s, e, n]
interface PeriodImage { from: string; to: string; png: string; }
interface ChangeData {
  available: boolean;
  bbox?: BBox;
  baseline?: PeriodImage;
  recent?: PeriodImage;
  diff?: string;
  error?: string;
}
type Status = "idle" | "loading" | "ready" | "unavailable" | "error";

const S2_MIN = "2017-01-01";
const S2_MIN_YEAR = 2017;
const NOW_YEAR = new Date().getUTCFullYear();
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ATTR = "Imagery &copy; Esri. Sentinel-2 &copy; Copernicus.";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultWindows(baselineDate: string) {
  const now = new Date();
  const recentYear = now.getUTCMonth() >= 9 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const baseYear = Math.min(Number(baselineDate.slice(0, 4)) || recentYear - 1, recentYear - 1);
  return {
    baselineFrom: `${baseYear}-04-01`, baselineTo: `${baseYear}-09-30`,
    recentFrom: `${recentYear}-04-01`, recentTo: `${recentYear}-09-30`,
  };
}

function fmt(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Padded bbox of the parcel, the initial framing. */
function geomBBox(geom: Polygon, pad: number): BBox {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const [lng, lat] of geom.coordinates[0] ?? []) {
    w = Math.min(w, lng); e = Math.max(e, lng); s = Math.min(s, lat); n = Math.max(n, lat);
  }
  const px = (e - w) * pad || 0.0015, py = (n - s) * pad || 0.0015;
  return [w - px, s - py, e + px, n + py];
}

const cornerCoords = ([w, s, e, n]: BBox): [[number, number], [number, number], [number, number], [number, number]] =>
  [[w, n], [e, n], [e, s], [w, s]];

/**
 * Create one satellite map with the given period image(s) overlaid on the bbox,
 * plus the parcel outline. Native MapLibre interaction (scroll/drag zoom, the
 * on-map +/- control), exactly like the dashboard map.
 */
function makeMap(container: HTMLDivElement, imgs: string[], bbox: BBox, geom: Polygon): maplibregl.Map {
  const [w, s, e, n] = bbox;
  const map = new maplibregl.Map({
    container,
    style: {
      version: 8,
      sources: { satellite: { type: "raster", tiles: [ESRI], tileSize: 256, maxzoom: 19, attribution: ATTR } },
      layers: [{ id: "satellite", type: "raster", source: "satellite" }],
    },
    center: [(w + e) / 2, (s + n) / 2],
    zoom: 13,
    attributionControl: { compact: true },
    preserveDrawingBuffer: true,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  map.on("load", () => {
    imgs.forEach((url, i) => {
      map.addSource(`img${i}`, { type: "image", url, coordinates: cornerCoords(bbox) });
      map.addLayer({ id: `img${i}`, type: "raster", source: `img${i}`, paint: { "raster-opacity": i === 1 ? 0.85 : 1 } });
    });
    map.addSource("parcel", { type: "geojson", data: { type: "Feature", properties: {}, geometry: geom } });
    map.addLayer({
      id: "parcel-line",
      type: "line",
      source: "parcel",
      paint: { "line-color": "#ffffff", "line-width": 2, "line-dasharray": [2, 1.5] },
    });
    map.fitBounds([[w, s], [e, n]], { padding: 10, duration: 0 });
  });
  return map;
}

/** Keep several maps' cameras locked together. */
function linkMaps(maps: maplibregl.Map[]) {
  let moving = false;
  for (const m of maps) {
    m.on("move", () => {
      if (moving) return;
      moving = true;
      const center = m.getCenter(), zoom = m.getZoom(), bearing = m.getBearing(), pitch = m.getPitch();
      for (const o of maps) if (o !== m) o.jumpTo({ center, zoom, bearing, pitch });
      moving = false;
    });
  }
}

function updateImg(map: maplibregl.Map | undefined, i: number, url: string, coords: ReturnType<typeof cornerCoords>) {
  const src = map?.getSource(`img${i}`) as maplibregl.ImageSource | undefined;
  if (src && "updateImage" in src) src.updateImage({ url, coordinates: coords });
}

/**
 * Habitat change viewer. Pick a baseline and comparison period, then pan and
 * zoom three linked satellite maps (before, after, detected change) exactly like
 * the dashboard map: any zoom or pan is mirrored on all three. Imagery re-fetches
 * from Copernicus for the current view, so the PDF captures what is on screen.
 */
export function ChangeMap({
  parcelId,
  geom,
  baselineDate,
}: {
  parcelId: string;
  geom: Polygon;
  baselineDate: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<ChangeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [win, setWin] = useState(() => defaultWindows(baselineDate));
  const [updating, setUpdating] = useState(false);

  const winRef = useRef(win); winRef.current = win;
  const dataRef = useRef<ChangeData | null>(null);
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const changeRef = useRef<HTMLDivElement>(null);
  const mapsRef = useRef<{ before?: maplibregl.Map; after?: maplibregl.Map; change?: maplibregl.Map }>({});
  const createdRef = useRef(false);
  const invalid = win.baselineFrom >= win.baselineTo || win.recentFrom >= win.recentTo;
  const invalidRef = useRef(invalid); invalidRef.current = invalid;

  async function fetchAndApply(bounds: BBox, silent: boolean) {
    if (invalidRef.current) return;
    if (silent) setUpdating(true);
    else setStatus("loading");
    setError(null);
    try {
      const w = winRef.current;
      const qs = new URLSearchParams({
        baselineFrom: w.baselineFrom, baselineTo: w.baselineTo,
        recentFrom: w.recentFrom, recentTo: w.recentTo,
        w: String(bounds[0]), s: String(bounds[1]), e: String(bounds[2]), n: String(bounds[3]),
      });
      const res = await fetch(`/api/parcels/${parcelId}/change?${qs}`);
      const j = (await res.json()) as ChangeData;
      if (!res.ok) throw new Error(j.error ?? `request failed (${res.status})`);
      if (!j.available) { setStatus("unavailable"); return; }
      dataRef.current = j;
      setData(j);
      if (createdRef.current && j.bbox) {
        const c = cornerCoords(j.bbox);
        updateImg(mapsRef.current.before, 0, j.baseline!.png, c);
        updateImg(mapsRef.current.after, 0, j.recent!.png, c);
        updateImg(mapsRef.current.change, 0, j.recent!.png, c);
        updateImg(mapsRef.current.change, 1, j.diff!, c);
      } else {
        setStatus("ready");
      }
    } catch (e) {
      if (!silent) { setError((e as Error).message); setStatus("error"); }
    } finally {
      setUpdating(false);
    }
  }

  // Create the three linked maps once, the first time imagery is ready.
  useEffect(() => {
    if (status !== "ready" || createdRef.current) return;
    const j = dataRef.current;
    if (!j?.bbox || !beforeRef.current || !afterRef.current || !changeRef.current) return;
    const before = makeMap(beforeRef.current, [j.baseline!.png], j.bbox, geom);
    const after = makeMap(afterRef.current, [j.recent!.png], j.bbox, geom);
    const change = makeMap(changeRef.current, [j.recent!.png, j.diff!], j.bbox, geom);
    mapsRef.current = { before, after, change };
    createdRef.current = true;
    linkMaps([before, after, change]);

    let t: ReturnType<typeof setTimeout>;
    const onMoveEnd = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const b = before.getBounds();
        fetchAndApply([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], true);
      }, 500);
    };
    before.on("moveend", onMoveEnd);

    return () => {
      clearTimeout(t);
      [before, after, change].forEach((m) => m.remove());
      mapsRef.current = {};
      createdRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function compareOrUpdate() {
    if (createdRef.current && mapsRef.current.before) {
      const b = mapsRef.current.before.getBounds();
      fetchAndApply([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], true);
    } else {
      fetchAndApply(geomBBox(geom, 0.15), false);
    }
  }

  function exportThisView() {
    const m = mapsRef.current.before;
    if (!m) return;
    const b = m.getBounds();
    const url =
      `/api/reports?parcelId=${parcelId}&format=pdf` +
      `&baselineFrom=${win.baselineFrom}&baselineTo=${win.baselineTo}` +
      `&recentFrom=${win.recentFrom}&recentTo=${win.recentTo}` +
      `&w=${b.getWest()}&s=${b.getSouth()}&e=${b.getEast()}&n=${b.getNorth()}`;
    window.location.href = url;
  }

  return (
    <div className="card p-4">
      <div className="mb-3">
        <h2 className="font-semibold text-ink">Habitat change map</h2>
        <p className="text-xs text-muted">
          Pan and zoom any map (scroll or drag); all three stay in sync. From Sentinel-2 (Copernicus).
        </p>
      </div>

      {/* Historical period control: scrub by year, or set specific dates */}
      <div className="mb-3 space-y-4 rounded-xl bg-panel px-4 py-4">
        <PeriodScrubber
          label="Baseline period"
          from={win.baselineFrom}
          to={win.baselineTo}
          onYear={(y) => setWin((p) => ({ ...p, baselineFrom: `${y}-04-01`, baselineTo: `${y}-09-30` }))}
          onFrom={(v) => setWin((p) => ({ ...p, baselineFrom: v }))}
          onTo={(v) => setWin((p) => ({ ...p, baselineTo: v }))}
        />
        <PeriodScrubber
          label="Compare period"
          from={win.recentFrom}
          to={win.recentTo}
          onYear={(y) => setWin((p) => ({ ...p, recentFrom: `${y}-04-01`, recentTo: `${y}-09-30` }))}
          onFrom={(v) => setWin((p) => ({ ...p, recentFrom: v }))}
          onTo={(v) => setWin((p) => ({ ...p, recentTo: v }))}
        />
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className={`text-[11px] ${invalid ? "text-orchid" : "text-muted"}`}>
            {invalid ? "Each period's start date must be before its end date." : "Scrub by year, or set specific dates."}
          </span>
          <button
            onClick={compareOrUpdate}
            disabled={invalid || status === "loading"}
            className="rounded-md bg-moss px-3.5 py-2 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50"
          >
            {status === "loading" ? "Running..." : status === "idle" ? "Compare periods" : "Update periods"}
          </button>
        </div>
      </div>

      {status === "idle" && (
        <div className="rounded-xl bg-panel px-4 py-8 text-center text-sm text-muted">
          Pick a baseline and a comparison period, then compare to pan and zoom the imagery side by side.
        </div>
      )}
      {status === "loading" && (
        <div className="flex h-[260px] items-center justify-center rounded-xl bg-panel text-sm text-muted">
          Reading Sentinel-2 imagery for both periods...
        </div>
      )}
      {status === "unavailable" && (
        <div className="rounded-xl bg-panel px-4 py-6 text-sm text-muted">
          The change viewer needs Copernicus credentials. Set <code className="text-ink">CDSE_CLIENT_ID</code>{" "}
          and <code className="text-ink">CDSE_CLIENT_SECRET</code> to enable live Sentinel-2 change detection.
        </div>
      )}
      {status === "error" && (
        <div className="rounded-xl border border-orchid/40 bg-[#F1EAF7] px-4 py-3 text-sm text-orchid">
          Could not build the comparison: {error}
          <button onClick={compareOrUpdate} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* The maps mount once ready; kept mounted so cameras persist. */}
      <div className={status === "ready" ? "space-y-3" : "hidden"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-muted">
            Zoom and drag like the dashboard map; the change map follows.
            {updating && <span className="ml-1 animate-pulse text-forest">updating imagery...</span>}
          </span>
          <button onClick={exportThisView} className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-panel">
            Evidence pack of this view (PDF)
          </button>
        </div>

        {/* All three panels are the same size so they share one viewport, and
            the Sentinel overlay fills each identically (no basemap showing at
            the edges). Before and After sit side by side; the change map and a
            legend take the second row. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <MapPanel innerRef={beforeRef} badge="Before" title="Baseline period" subtitle={`${fmt(data?.baseline?.from)} to ${fmt(data?.baseline?.to)}`} />
          <MapPanel innerRef={afterRef} badge="After" title="Comparison period" subtitle={`${fmt(data?.recent?.from)} to ${fmt(data?.recent?.to)}`} />
          <MapPanel innerRef={changeRef} badge="Change" title="Detected change" subtitle="NDVI difference" />
          <div className="flex flex-col justify-center rounded-xl border border-line bg-panel p-4">
            <div className="text-xs font-semibold text-ink">Detected change</div>
            <div className="mt-2 flex flex-col gap-1.5 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "#D93B2E" }} /> Vegetation loss (condition down)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: "#399948" }} /> Vegetation gain (condition up)
              </span>
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
              True-colour Sentinel-2, overlaid with the NDVI difference between the two periods.
              Decision support only; field verification is authoritative.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A map container with a badge and caption (the MapLibre map mounts into it). */
function MapPanel({
  innerRef,
  badge,
  title,
  subtitle,
}: {
  innerRef: React.RefObject<HTMLDivElement>;
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-line">
      <div className="relative">
        <div ref={innerRef} className="h-[300px] w-full bg-panel" />
        <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {badge}
        </span>
      </div>
      <figcaption className="flex items-center justify-between gap-2 border-t border-line bg-white px-3 py-2">
        <span className="text-xs font-semibold text-ink">{title}</span>
        <span className="text-[11px] tabular-nums text-muted">{subtitle}</span>
      </figcaption>
    </figure>
  );
}

/** Tick years for the scrubber axis, spaced to stay legible. */
function tickYears(): number[] {
  const step = NOW_YEAR - S2_MIN_YEAR > 7 ? 2 : 1;
  const out: number[] = [];
  for (let y = S2_MIN_YEAR; y <= NOW_YEAR; y += step) out.push(y);
  if (out[out.length - 1] !== NOW_YEAR) out.push(NOW_YEAR);
  return out;
}

/**
 * One period control: a year scrubber (styled like the dashboard Y0 to Y30
 * slider) that snaps the window to a year's growing season, plus specific-date
 * boxes for an exact window. The two stay in sync through the same from/to state.
 */
function PeriodScrubber({
  label,
  from,
  to,
  onYear,
  onFrom,
  onTo,
}: {
  label: string;
  from: string;
  to: string;
  onYear: (y: number) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  const year = Math.min(NOW_YEAR, Math.max(S2_MIN_YEAR, Number(from.slice(0, 4)) || NOW_YEAR - 1));
  const pct = ((year - S2_MIN_YEAR) / (NOW_YEAR - S2_MIN_YEAR)) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
        <span className="text-xs font-medium tabular-nums text-ink">{fmt(from)} to {fmt(to)}</span>
      </div>
      <input
        type="range"
        min={S2_MIN_YEAR}
        max={NOW_YEAR}
        value={year}
        onChange={(e) => onYear(Number(e.target.value))}
        aria-label={`${label} year`}
        className="bc-scrubber"
        style={{ background: `linear-gradient(90deg,#8E5BB5 0%,#8E5BB5 ${pct}%,#DCE5D7 ${pct}%,#DCE5D7 100%)` }}
      />
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted">
        {tickYears().map((y) => <span key={y}>{y}</span>)}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wide text-muted">Specific dates</span>
        <input type="date" aria-label="Start date" value={from} min={S2_MIN} max={today()} onChange={(e) => onFrom(e.target.value)}
          className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink" />
        <span className="text-xs text-muted">to</span>
        <input type="date" aria-label="End date" value={to} min={S2_MIN} max={today()} onChange={(e) => onTo(e.target.value)}
          className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink" />
      </div>
    </div>
  );
}
