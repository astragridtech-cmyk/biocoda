import {
  assessParcel,
  classify,
  fieldPointFromVerification,
  hashU32,
  observedConditionAt,
  parcelProfile,
  scoreToBand,
  type ConditionBand,
  type FieldPoint,
  type PlanExtraction,
} from "@biocoda/shared";
import { MockMetricAdapter } from "@biocoda/adapters";
import { seedParcels, parcelLookups } from "@biocoda/db";
import { synthSquare } from "./plan-geom.js";
import type {
  ParcelRow,
  PortfolioSummary,
  SurveyTaskRow,
  VerificationRow,
} from "./data.js";

/** Management year the demo's "now" sits at (matches lib/portfolio CURRENT_YEAR). */
const NOW_YEAR = 9;

interface MemPlan {
  id: string;
  title: string;
  siteName: string;
  parcelIds: string[];
  createdAt: string;
}

export interface MemNotification {
  id: string;
  type: "at_risk" | "survey" | "plan" | "digest";
  title: string;
  body: string;
  parcelId: string | null;
  createdAt: string;
  read: boolean;
}

/**
 * Zero-infra demo backend.
 *
 * When BIOCODA_DEMO=1 (and no Postgres is available) the dashboard serves the full
 * seeded portfolio straight from the deterministic generator (same data the
 * DB seed would hold) with an in-memory store for survey tasks and field
 * verifications. Mutations persist for the life of the dev server, so the whole
 * demo flow (dispatch → verify → export) works without a database.
 */
export function isDemo(): boolean {
  return process.env.BIOCODA_DEMO === "1";
}

const DEMO_NOW = new Date("2026-06-01T00:00:00Z");
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

interface MemTask extends SurveyTaskRow {}
interface MemVerification extends VerificationRow {
  parcelId: string;
}

interface MemState {
  parcels: ParcelRow[];
  tasks: MemTask[];
  verifications: MemVerification[];
  plans: MemPlan[];
  notifications: MemNotification[];
  seq: number;
}

const g = globalThis as unknown as { __gkDemo?: MemState };

function build(): MemState {
  const parcels = seedParcels();
  const { meta } = parcelLookups(parcels);
  const metric = new MockMetricAdapter(meta);

  const rows: ParcelRow[] = [];
  const tasks: MemTask[] = [];
  let seq = 0;

  for (const p of parcels) {
    const profile = parcelProfile(p.id);
    const baselineIso = `${p.baselineDate}T00:00:00Z`;
    const year = Math.max(
      0,
      Math.floor((DEMO_NOW.getTime() - new Date(baselineIso).getTime()) / MS_PER_YEAR),
    );
    const actual = round2(observedConditionAt(p.id, year));
    const { status, required, gap } = classify(
      {
        baselineCondition: profile.baselineCondition,
        targetCondition: profile.targetCondition,
        targetYear: profile.byYear,
      },
      year,
      actual,
    );
    // MockMetricAdapter.baseline is async but deterministic; resolve eagerly.
    const units = unitsFor(meta[p.id]!.areaHa, profile.baselineCondition, profile.targetCondition);

    rows.push({
      id: p.id,
      name: p.name,
      habitatType: p.habitatType,
      metricRef: p.metricRef,
      areaHa: p.areaHa,
      baselineDate: p.baselineDate,
      geom: p.geom,
      baselineCondition: profile.baselineCondition,
      targetCondition: profile.targetCondition,
      targetUnits: units.target,
      baselineUnits: units.baseline,
      byYear: profile.byYear,
      status,
      actual,
      required: round2(required),
      gap: round2(gap),
      year,
    });

    if (status === "at_risk") {
      tasks.push({
        id: `task-${seq++}`,
        parcelId: p.id,
        parcelName: p.name,
        habitatType: p.habitatType,
        reason: `Earth observation trajectory at risk: ${scoreToBand(actual)} vs required ${scoreToBand(
          round2(required),
        )} (gap ${round2(gap)})`,
        status: "open",
        createdAt: DEMO_NOW.toISOString(),
      });
    }
  }
  void metric;

  // Seed notifications: one early-warning alert per currently at-risk parcel,
  // plus a portfolio-digest notice. These are the alerts a fresh EO pass would fire.
  const notifications: MemNotification[] = [];
  for (const r of rows) {
    const a = assessParcel(r.id, NOW_YEAR);
    if (a.kind === "risk") {
      notifications.push({
        id: `ntf-${seq++}`,
        type: "at_risk",
        title: `${r.name} flagged at risk`,
        body: `Earth observation condition is ${a.gap.toFixed(2)} below the required trajectory at year ${NOW_YEAR}. A field survey is recommended.`,
        parcelId: r.id,
        createdAt: DEMO_NOW.toISOString(),
        read: false,
      });
    }
  }
  const atRiskCount = notifications.length;
  notifications.unshift({
    id: `ntf-${seq++}`,
    type: "digest",
    title: "Quarterly portfolio digest ready",
    body: `${atRiskCount} parcel${atRiskCount === 1 ? "" : "s"} at risk at year ${NOW_YEAR}. Open the digest for the full state of the portfolio.`,
    parcelId: null,
    createdAt: DEMO_NOW.toISOString(),
    read: false,
  });

  return { parcels: rows, tasks, verifications: [], plans: [], notifications, seq };
}

function state(): MemState {
  if (!g.__gkDemo) g.__gkDemo = build();
  return g.__gkDemo;
}

// ── read API (mirrors data.ts) ──────────────────────────────────────────────

export function listParcels(): ParcelRow[] {
  return [...state().parcels].sort((a, b) => a.name.localeCompare(b.name));
}

export function getParcel(id: string): ParcelRow | null {
  return state().parcels.find((p) => p.id === id) ?? null;
}

export function listVerifications(parcelId: string): VerificationRow[] {
  return state()
    .verifications.filter((v) => v.parcelId === parcelId)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function listSurveyTasks(status?: string): SurveyTaskRow[] {
  return state()
    .tasks.filter((t) => (status ? t.status === status : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function openTaskForParcel(parcelId: string): SurveyTaskRow | null {
  return (
    state().tasks.find(
      (t) => t.parcelId === parcelId && t.status !== "completed" && t.status !== "cancelled",
    ) ?? null
  );
}

export function createSurveyTask(parcelId: string, reason: string): string {
  const s = state();
  const p = getParcel(parcelId);
  const id = `task-${s.seq++}`;
  s.tasks.unshift({
    id,
    parcelId,
    parcelName: p?.name ?? parcelId,
    habitatType: p?.habitatType ?? "",
    reason,
    status: "open",
    createdAt: new Date().toISOString(),
  });
  pushNotification({
    type: "survey",
    title: `Field survey dispatched: ${p?.name ?? parcelId}`,
    body: reason,
    parcelId,
  });
  return id;
}

// ── notifications ───────────────────────────────────────────────────────────

export function listNotifications(): MemNotification[] {
  return [...state().notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function markNotificationsRead(id?: string): void {
  for (const n of state().notifications) {
    if (!id || n.id === id) n.read = true;
  }
}

export function pushNotification(n: Omit<MemNotification, "id" | "createdAt" | "read">): void {
  const s = state();
  s.notifications.unshift({
    ...n,
    id: `ntf-${s.seq++}`,
    createdAt: new Date().toISOString(),
    read: false,
  });
}

export function fieldPointsByParcel(): Record<string, FieldPoint[]> {
  const s = state();
  const out: Record<string, FieldPoint[]> = {};
  for (const v of s.verifications) {
    const parcel = s.parcels.find((p) => p.id === v.parcelId);
    if (!parcel) continue;
    (out[v.parcelId] ??= []).push(
      fieldPointFromVerification(parcel.baselineDate, v.at, v.condition),
    );
  }
  return out;
}

export function addVerification(input: {
  parcelId: string;
  condition: ConditionBand;
  notes: string;
  photos: string[];
  lng: number;
  lat: number;
  ecologist?: string;
}): string {
  const s = state();
  const id = `ver-${s.seq++}`;
  s.verifications.unshift({
    id,
    parcelId: input.parcelId,
    condition: input.condition,
    notes: input.notes,
    photos: input.photos,
    at: new Date().toISOString(),
    ecologist: input.ecologist ?? "Tom Hardy",
    lng: input.lng,
    lat: input.lat,
  });
  // Close any open task on this parcel.
  for (const t of s.tasks) {
    if (t.parcelId === input.parcelId && (t.status === "open" || t.status === "in_progress")) {
      t.status = "completed";
    }
  }
  return id;
}

/**
 * Commit an approved plan extraction: append its parcels to the portfolio.
 * Imported parcels get ids that resolve to "Awaiting EO" (no baseline captured
 * yet) and synthesised geometry, so they appear in the portfolio immediately.
 */
export function commitPlan(
  extraction: PlanExtraction,
  approvedRefs: string[],
  geometries: Record<string, import("@biocoda/shared").Polygon> = {},
): { planId: string; parcelIds: string[] } {
  const s = state();
  const planId = `plan-${s.seq++}`;
  const chosen = extraction.parcels.filter((p) => approvedRefs.includes(p.ref));
  const today = new Date().toISOString().slice(0, 10);
  const slug =
    extraction.plan.siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    "plan";
  const ids: string[] = [];

  chosen.forEach((p, i) => {
    const id = awaitingId(`plan-${slug}-${p.ref.toLowerCase()}`);
    const units = unitsFor(p.areaHa, p.baselineCondition, p.targetCondition);
    s.parcels.push({
      id,
      name: p.name,
      habitatType: p.habitatType,
      metricRef: `BM-${id}`,
      areaHa: p.areaHa,
      baselineDate: today,
      geom: geometries[p.ref] ?? synthSquare(i, p.areaHa),
      baselineCondition: p.baselineCondition,
      targetCondition: p.targetCondition,
      targetUnits: p.targetUnits ?? units.target,
      baselineUnits: units.baseline,
      byYear: p.byYear,
      status: null,
      actual: null,
      required: null,
      gap: null,
      year: null,
    });
    ids.push(id);
  });

  s.plans.unshift({
    id: planId,
    title: extraction.plan.title,
    siteName: extraction.plan.siteName,
    parcelIds: ids,
    createdAt: today,
  });
  pushNotification({
    type: "plan",
    title: `Plan imported: ${extraction.plan.title}`,
    body: `${ids.length} parcel${ids.length === 1 ? "" : "s"} added to the portfolio as Awaiting Earth observation.`,
    parcelId: null,
  });
  return { planId, parcelIds: ids };
}

/** Pick an id that hashes to the "Awaiting EO" bucket (hash % 7 === 0). */
function awaitingId(base: string): string {
  let id = base;
  let n = 0;
  while (hashU32(id) % 7 !== 0) {
    n += 1;
    id = `${base}-${n}`;
  }
  return id;
}

export function portfolioSummary(): PortfolioSummary {
  const s = state();
  const atRisk = s.parcels.filter((p) => p.status === "at_risk").length;
  const onTrack = s.parcels.filter((p) => p.status === "on_track").length;
  const openTasks = s.tasks.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const totalAreaHa = round2(s.parcels.reduce((sum, p) => sum + p.areaHa, 0));
  return { total: s.parcels.length, atRisk, onTrack, openTasks, totalAreaHa };
}

// ── helpers (mirror MockMetricAdapter unit proxy) ───────────────────────────

const BAND: Record<ConditionBand, number> = { poor: 1, moderate: 2, good: 3 };
function unitsFor(areaHa: number, baseline: ConditionBand, target: ConditionBand) {
  const u = (band: ConditionBand) => Math.round(areaHa * BAND[band] * 2 * 10) / 10;
  return { baseline: u(baseline), target: u(target) };
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
