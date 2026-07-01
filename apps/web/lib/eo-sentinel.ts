import "server-only";
import {
  bbox as polygonBbox,
  classify,
  type BBox,
  type ConditionPoint,
  type Polygon,
  type TrajectoryFlag,
} from "@biocoda/shared";

/**
 * Real Earth observation via Copernicus Data Space Ecosystem (Sentinel Hub).
 *
 * Pulls a Sentinel-2 NDVI time series for a parcel polygon from the Statistical
 * API and converts it into BioCoda's 0-to-3 condition score. Enabled when the
 * CDSE client credentials are set and BIOCODA_EO_REAL=1; otherwise the EO client
 * falls back to the worker or the deterministic model. This is the real wiring
 * behind the EoHabitatAdapter, swappable with no change to calling code.
 */
const TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const STATS_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics";
const PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process";

const DEMO_NOW = new Date("2026-06-01T00:00:00Z");
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Real trajectory monitoring: needs creds AND the opt-in flag (passive, per tick). */
export function hasSentinel(): boolean {
  return hasSentinelCreds() && process.env.BIOCODA_EO_REAL === "1";
}

/**
 * The spatial change map is an explicit, user-triggered fetch, so it only needs
 * the Copernicus credentials (not the passive BIOCODA_EO_REAL flag).
 */
export function hasSentinelCreds(): boolean {
  return Boolean(process.env.CDSE_CLIENT_ID && process.env.CDSE_CLIENT_SECRET);
}

const g = globalThis as unknown as { __cdseToken?: { token: string; exp: number } };

async function token(): Promise<string> {
  const cached = g.__cdseToken;
  if (cached && Date.now() < cached.exp - 60_000) return cached.token;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.CDSE_CLIENT_ID!,
      client_secret: process.env.CDSE_CLIENT_SECRET!,
    }),
  });
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) throw new Error("CDSE token request failed");
  g.__cdseToken = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 1800) * 1000 };
  return j.access_token;
}

const EVALSCRIPT = `//VERSION=3
function setup(){return{input:[{bands:["B04","B08","dataMask"]}],output:[{id:"ndvi",bands:1},{id:"dataMask",bands:1}]};}
function evaluatePixel(s){let ndvi=(s.B08-s.B04)/(s.B08+s.B04);return{ndvi:[ndvi],dataMask:[s.dataMask]};}`;

/** Sentinel-2 NDVI mean per interval over a polygon. Cloudy gaps are skipped. */
async function ndviSeries(
  geometry: Polygon,
  fromIso: string,
  toIso: string,
  interval = "P1M",
): Promise<{ date: string; ndvi: number }[]> {
  const t = await token();
  const body = {
    input: {
      bounds: { geometry, properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" } },
      data: [{ type: "sentinel-2-l2a", dataFilter: { mosaickingOrder: "leastCC" } }],
    },
    aggregation: {
      timeRange: { from: fromIso, to: toIso },
      aggregationInterval: { of: interval },
      evalscript: EVALSCRIPT,
      resx: 10,
      resy: 10,
    },
  };
  const res = await fetch(STATS_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${t}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Sentinel Hub statistics failed (${res.status})`);
  const j = (await res.json()) as {
    data?: { interval: { from: string }; outputs?: { ndvi?: { bands?: { B0?: { stats?: { mean?: number; sampleCount?: number } } } } } }[];
  };
  const out: { date: string; ndvi: number }[] = [];
  for (const iv of j.data ?? []) {
    const stats = iv.outputs?.ndvi?.bands?.B0?.stats;
    if (!stats || !stats.sampleCount || stats.mean == null || Number.isNaN(stats.mean)) continue;
    out.push({ date: iv.interval.from, ndvi: stats.mean });
  }
  return out;
}

/**
 * NDVI to condition (0-3). Illustrative mapping anchored to the Defra bands:
 * NDVI 0.20 ~ Poor (1), 0.45 ~ Moderate (2), 0.70+ ~ Good (3). The production
 * model would use a habitat-specific classifier; this is the MVP proxy.
 */
export function ndviToCondition(ndvi: number): number {
  return Math.max(0, Math.min(3, 1 + (ndvi - 0.2) / 0.25));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export async function sentinelConditionSeries(
  parcelId: string,
  geom: Polygon,
  fromIso: string,
  toIso: string,
): Promise<ConditionPoint[]> {
  const series = await ndviSeries(geom, fromIso, toIso);
  return series.map((s) => ({
    parcelId,
    metric: "condition_score",
    value: round2(ndviToCondition(s.ndvi)),
    capturedAt: s.date,
    source: "eo",
  }));
}

export async function sentinelTrajectory(
  parcelId: string,
  geom: Polygon,
  baselineDate: string,
  required: { baselineCondition: "poor" | "moderate" | "good"; targetCondition: "poor" | "moderate" | "good"; byYear: number },
): Promise<TrajectoryFlag> {
  const baselineIso = `${baselineDate}T00:00:00Z`;
  const series = await sentinelConditionSeries(parcelId, geom, baselineIso, DEMO_NOW.toISOString());
  const latest = series[series.length - 1];
  const year = Math.max(0, Math.floor((DEMO_NOW.getTime() - new Date(baselineIso).getTime()) / MS_PER_YEAR));
  const actual = latest ? latest.value : 0;
  const { status, required: req, gap } = classify(
    { baselineCondition: required.baselineCondition, targetCondition: required.targetCondition, targetYear: required.byYear },
    year,
    actual,
  );
  return {
    parcelId,
    status,
    year,
    actual: round2(actual),
    required: round2(req),
    gap: round2(gap),
    detectedAt: latest ? latest.capturedAt : DEMO_NOW.toISOString(),
  };
}

// ── Spatial change detection (Process API) ──────────────────────────────────

/** Growing-season window (Apr 1 to Sep 30) for a year, when NDVI is meaningful. */
function growingSeason(year: number): { from: string; to: string } {
  return { from: `${year}-04-01T00:00:00Z`, to: `${year}-09-30T23:59:59Z` };
}

/** Bitemporal NDVI difference: red where vegetation was lost, green where gained. */
const CHANGE_EVALSCRIPT = `//VERSION=3
function setup(){return{input:[{datasource:"baseline",bands:["B04","B08","dataMask"]},{datasource:"recent",bands:["B04","B08","dataMask"]}],output:{bands:4}};}
function ndvi(s){return (s.B08-s.B04)/(s.B08+s.B04);}
function evaluatePixel(x){var b=x.baseline[0],r=x.recent[0];if(!b||!r||b.dataMask===0||r.dataMask===0)return [0,0,0,0];var d=ndvi(r)-ndvi(b);var a=Math.min(0.9,Math.abs(d)/0.4);if(d<-0.05)return [0.85,0.23,0.18,a];if(d>0.05)return [0.22,0.60,0.28,a];return [0,0,0,0];}`;

/**
 * True-colour Sentinel-2 (RGB) for a single period. Gain plus a gamma tone
 * curve so vegetation reads at natural brightness instead of the dark, muddy
 * output a plain 2.5x gain gives (surface reflectance is low over vegetation).
 */
const TRUECOLOR_EVALSCRIPT = `//VERSION=3
function setup(){return{input:["B02","B03","B04","dataMask"],output:{bands:4}};}
function adj(v){var x=v*3.0;if(x<0)x=0;return Math.pow(x,0.7);}
function evaluatePixel(s){return [adj(s.B04),adj(s.B03),adj(s.B02),s.dataMask];}`;

export interface DateWindow {
  from: string;
  to: string;
}

export interface ChangeWindows {
  baseline: DateWindow;
  recent: DateWindow;
}

export interface ChangeMap {
  /** data URL (PNG) of the change raster, aligned to `bbox`. */
  png: string;
  /** [west, south, east, north] the PNG covers. */
  bbox: BBox;
  baseline: DateWindow;
  recent: DateWindow;
}

/** A single period's true-colour image with the window it was captured over. */
export interface PeriodImage extends DateWindow {
  /** data URL (PNG) aligned to the shared bbox. */
  png: string;
}

/** Before/after imagery plus the detected-change raster, all on one bbox. */
export interface ChangeComparison {
  bbox: BBox;
  baseline: PeriodImage;
  recent: PeriodImage;
  /** NDVI-difference raster (red loss, green gain, transparent stable). */
  diff: string;
}

/** Default before/after windows: baseline season vs the last completed season. */
export function defaultChangeWindows(baselineDate: string): ChangeWindows {
  const baseYear = Number(baselineDate.slice(0, 4)) || new Date().getUTCFullYear() - 2;
  const now = new Date();
  const recentYear = now.getUTCMonth() >= 9 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return {
    baseline: growingSeason(Math.min(baseYear, recentYear - 1)),
    recent: growingSeason(recentYear),
  };
}

/** Pad the bbox so the parcel is not flush against the raster edge. */
function paddedBounds(geom: Polygon): BBox {
  const box = polygonBbox(geom);
  const padX = (box[2] - box[0]) * 0.12 || 0.002;
  const padY = (box[3] - box[1]) * 0.12 || 0.002;
  return [box[0] - padX, box[1] - padY, box[2] + padX, box[3] + padY];
}

/** Output pixel dimensions from the bbox aspect ratio, capped for speed. */
function outputSize(bounds: BBox): { width: number; height: number } {
  const aspect = (bounds[2] - bounds[0]) / (bounds[3] - bounds[1]) || 1;
  // Long edge at 1024px; with bicubic resampling this keeps small AOIs looking
  // smooth rather than blocky (Sentinel-2 native is 10m, so this upsamples).
  const long = 1024;
  const width = aspect >= 1 ? long : Math.round(long * aspect);
  const height = aspect >= 1 ? Math.round(long / aspect) : long;
  return { width: Math.max(128, width), height: Math.max(128, height) };
}

/**
 * POST a Process API request and return the PNG as a data URL. When `clip` is a
 * polygon, Sentinel Hub masks the output to that geometry (dataMask=0 outside),
 * so the raster still fills `bounds` but data only exists inside the polygon.
 * Used to confine the change signal to the parcel/AOI.
 */
async function processPng(
  bounds: BBox,
  data: unknown[],
  evalscript: string,
  clip?: Polygon,
): Promise<string> {
  const { width, height } = outputSize(bounds);
  const bounds_: Record<string, unknown> = {
    bbox: bounds,
    properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
  };
  if (clip) bounds_.geometry = clip;
  // Bicubic resampling so upsampled 10m imagery reads smooth, not blocky.
  const sampled = (data as Record<string, unknown>[]).map((d) => ({
    ...d,
    processing: { upsampling: "BICUBIC", downsampling: "BICUBIC", ...((d.processing as Record<string, unknown>) ?? {}) },
  }));
  const body = {
    input: { bounds: bounds_, data: sampled },
    output: { width, height, responses: [{ identifier: "default", format: { type: "image/png" } }] },
    evalscript,
  };
  const t = await token();
  const res = await fetch(PROCESS_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${t}`, "content-type": "application/json", accept: "image/png" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Sentinel Hub process failed (${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/**
 * Spatial change map for a parcel: a per-pixel NDVI difference between a
 * baseline window and a comparison window, rendered as an RGBA PNG that overlays
 * the parcel on the map. Pass `windows` for an arbitrary before/after
 * comparison; omit it for the default growing seasons.
 */
export async function sentinelChangeMap(
  geom: Polygon,
  baselineDate: string,
  windows?: ChangeWindows,
): Promise<ChangeMap> {
  const bounds = paddedBounds(geom);
  const { baseline, recent } = windows ?? defaultChangeWindows(baselineDate);
  const png = await processPng(
    bounds,
    [
      { type: "sentinel-2-l2a", id: "baseline", dataFilter: { timeRange: baseline, mosaickingOrder: "leastCC" } },
      { type: "sentinel-2-l2a", id: "recent", dataFilter: { timeRange: recent, mosaickingOrder: "leastCC" } },
    ],
    CHANGE_EVALSCRIPT,
    geom, // confine the change signal to the parcel/AOI
  );
  return { png, bbox: bounds, baseline, recent };
}

/** True-colour Sentinel-2 image for one window, on the parcel's bbox. */
async function periodImage(bounds: BBox, window: DateWindow): Promise<PeriodImage> {
  const png = await processPng(
    bounds,
    [{ type: "sentinel-2-l2a", dataFilter: { timeRange: window, mosaickingOrder: "leastCC" } }],
    TRUECOLOR_EVALSCRIPT,
  );
  return { ...window, png };
}

/**
 * Full before/after comparison: true-colour baseline and comparison images plus
 * the NDVI-change raster, all aligned to the same bbox. Drives the side-by-side
 * UI and the PDF evidence pack. All three requests run in parallel.
 */
export async function sentinelComparison(
  geom: Polygon,
  baselineDate: string,
  windows?: ChangeWindows,
  boundsOverride?: BBox,
): Promise<ChangeComparison> {
  const bounds = boundsOverride ?? paddedBounds(geom);
  const { baseline, recent } = windows ?? defaultChangeWindows(baselineDate);
  const [baselineImg, recentImg, diff] = await Promise.all([
    periodImage(bounds, baseline),
    periodImage(bounds, recent),
    processPng(
      bounds,
      [
        { type: "sentinel-2-l2a", id: "baseline", dataFilter: { timeRange: baseline, mosaickingOrder: "leastCC" } },
        { type: "sentinel-2-l2a", id: "recent", dataFilter: { timeRange: recent, mosaickingOrder: "leastCC" } },
      ],
      CHANGE_EVALSCRIPT,
      geom, // confine the change signal to the parcel/AOI
    ),
  ]);
  return { bbox: bounds, baseline: baselineImg, recent: recentImg, diff };
}
