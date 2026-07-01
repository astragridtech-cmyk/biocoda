import {
  classify,
  observedConditionAt,
  requiredCurve as sharedRequiredCurve,
  type ConditionPoint,
  type Polygon,
  type TrajectoryFlag,
} from "@biocoda/shared";

/**
 * EO client. Source priority:
 *   1. Real Sentinel-2 via Copernicus (when CDSE creds + BIOCODA_EO_REAL are set
 *      and the parcel has geometry).
 *   2. The FastAPI worker (EO_WORKER_URL).
 *   3. The deterministic local model.
 * Each falls back to the next, so the dashboard never breaks. All share the
 * @biocoda/shared model for the required curve and classification.
 */

const WORKER = process.env.EO_WORKER_URL;
const DEMO_NOW = new Date("2026-06-01T00:00:00Z");
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export interface ParcelContext {
  parcelId: string;
  baselineDate: string; // ISO date
  baselineCondition: "poor" | "moderate" | "good";
  targetCondition: "poor" | "moderate" | "good";
  byYear: number;
  /** Parcel boundary, required for real Sentinel-2 EO. */
  geom?: Polygon;
}

async function trySentinelSeries(ctx: ParcelContext): Promise<ConditionPoint[] | null> {
  if (!ctx.geom) return null;
  try {
    const { hasSentinel, sentinelConditionSeries } = await import("./eo-sentinel.js");
    if (!hasSentinel()) return null;
    const from = `${ctx.baselineDate}T00:00:00Z`;
    return await sentinelConditionSeries(ctx.parcelId, ctx.geom, from, DEMO_NOW.toISOString());
  } catch {
    return null;
  }
}

async function trySentinelTrajectory(ctx: ParcelContext): Promise<TrajectoryFlag | null> {
  if (!ctx.geom) return null;
  try {
    const { hasSentinel, sentinelTrajectory } = await import("./eo-sentinel.js");
    if (!hasSentinel()) return null;
    return await sentinelTrajectory(ctx.parcelId, ctx.geom, ctx.baselineDate, {
      baselineCondition: ctx.baselineCondition,
      targetCondition: ctx.targetCondition,
      byYear: ctx.byYear,
    });
  } catch {
    return null;
  }
}

function yearsBetween(from: string, to: string): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / MS_PER_YEAR;
}

async function tryWorker<T>(path: string): Promise<T | null> {
  if (!WORKER) return null;
  try {
    const res = await fetch(`${WORKER}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getConditionSeries(ctx: ParcelContext): Promise<ConditionPoint[]> {
  const viaSentinel = await trySentinelSeries(ctx);
  if (viaSentinel && viaSentinel.length) return viaSentinel;
  const viaWorker = await tryWorker<ConditionPoint[]>(
    `/parcels/${ctx.parcelId}/condition`,
  );
  if (viaWorker) return viaWorker;
  return localSeries(ctx);
}

export async function getTrajectory(ctx: ParcelContext): Promise<TrajectoryFlag> {
  const viaSentinel = await trySentinelTrajectory(ctx);
  if (viaSentinel) return viaSentinel;
  const viaWorker = await tryWorker<TrajectoryFlag>(
    `/parcels/${ctx.parcelId}/trajectory`,
  );
  if (viaWorker) return viaWorker;
  return localTrajectory(ctx);
}

export async function getRequiredCurve(
  ctx: ParcelContext,
): Promise<{ year: number; required: number }[]> {
  const viaWorker = await tryWorker<{ year: number; required: number }[]>(
    `/parcels/${ctx.parcelId}/required-curve`,
  );
  if (viaWorker) return viaWorker;
  return sharedRequiredCurve({
    baselineCondition: ctx.baselineCondition,
    targetCondition: ctx.targetCondition,
    targetYear: ctx.byYear,
  });
}

// ── Local fallbacks (deterministic; mirror the worker) ──────────────────────

function localSeries(ctx: ParcelContext): ConditionPoint[] {
  const baseline = `${ctx.baselineDate}T00:00:00Z`;
  const out: ConditionPoint[] = [];
  const step = MS_PER_YEAR / 4;
  for (let t = new Date(baseline).getTime(); t <= DEMO_NOW.getTime(); t += step) {
    const iso = new Date(t).toISOString();
    const year = yearsBetween(baseline, iso);
    if (year < 0) continue;
    out.push({
      parcelId: ctx.parcelId,
      metric: "condition_score",
      value: round2(observedConditionAt(ctx.parcelId, year)),
      capturedAt: iso,
      source: "eo",
    });
  }
  return out;
}

function localTrajectory(ctx: ParcelContext): TrajectoryFlag {
  const baseline = `${ctx.baselineDate}T00:00:00Z`;
  const year = Math.max(0, Math.floor(yearsBetween(baseline, DEMO_NOW.toISOString())));
  const actual = observedConditionAt(ctx.parcelId, year);
  const { status, required, gap } = classify(
    {
      baselineCondition: ctx.baselineCondition,
      targetCondition: ctx.targetCondition,
      targetYear: ctx.byYear,
    },
    year,
    actual,
  );
  return {
    parcelId: ctx.parcelId,
    status,
    year,
    actual: round2(actual),
    required: round2(required),
    gap: round2(gap),
    detectedAt: DEMO_NOW.toISOString(),
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
