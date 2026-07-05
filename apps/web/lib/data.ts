import { withTenant, type Session } from "./db.js";
import type { ParcelContext } from "./eo.js";
import { fieldPointFromVerification, type FieldPoint, type Polygon, type ConditionBand } from "@biocoda/shared";
import * as demo from "./demo.js";

/** A parcel row joined with its target and latest trajectory flag. */
export interface ParcelRow {
  id: string;
  name: string;
  habitatType: string;
  metricRef: string;
  areaHa: number;
  baselineDate: string;
  geom: Polygon;
  baselineCondition: ConditionBand;
  targetCondition: ConditionBand;
  targetUnits: number;
  baselineUnits: number;
  byYear: number;
  status: "on_track" | "at_risk" | null;
  actual: number | null;
  required: number | null;
  gap: number | null;
  year: number | null;
}

const PARCEL_SELECT = `
  SELECT p.id, p.name, p.habitat_type, p.metric_ref, p.area_ha,
         to_char(p.baseline_date, 'YYYY-MM-DD') AS baseline_date,
         ST_AsGeoJSON(p.geom)::json AS geom,
         t.baseline_condition, t.target_condition, t.target_units, t.baseline_units, t.by_year,
         f.status, f.actual, f.required, f.gap, f.year
  FROM parcel p
  JOIN target t ON t.parcel_id = p.id
  LEFT JOIN LATERAL (
    SELECT status, actual, required, gap, year
    FROM trajectory_flag tf
    WHERE tf.parcel_id = p.id
    ORDER BY tf.detected_at DESC
    LIMIT 1
  ) f ON true
`;

function mapRow(r: Record<string, unknown>): ParcelRow {
  return {
    id: r.id as string,
    name: r.name as string,
    habitatType: r.habitat_type as string,
    metricRef: r.metric_ref as string,
    areaHa: Number(r.area_ha),
    baselineDate: r.baseline_date as string,
    geom: r.geom as Polygon,
    baselineCondition: r.baseline_condition as ConditionBand,
    targetCondition: r.target_condition as ConditionBand,
    targetUnits: Number(r.target_units),
    baselineUnits: Number(r.baseline_units),
    byYear: Number(r.by_year),
    status: (r.status as ParcelRow["status"]) ?? null,
    actual: r.actual === null || r.actual === undefined ? null : Number(r.actual),
    required: r.required === null || r.required === undefined ? null : Number(r.required),
    gap: r.gap === null || r.gap === undefined ? null : Number(r.gap),
    year: r.year === null || r.year === undefined ? null : Number(r.year),
  };
}

export function toContext(p: ParcelRow): ParcelContext {
  return {
    parcelId: p.id,
    baselineDate: p.baselineDate,
    baselineCondition: p.baselineCondition,
    targetCondition: p.targetCondition,
    byYear: p.byYear,
    geom: p.geom,
  };
}

export async function listParcels(session: Session): Promise<ParcelRow[]> {
  if (demo.isDemo()) return demo.listParcels();
  return withTenant(session, async (c) => {
    const { rows } = await c.query(`${PARCEL_SELECT} ORDER BY p.name`);
    return rows.map(mapRow);
  });
}

export async function getParcel(
  session: Session,
  id: string,
): Promise<ParcelRow | null> {
  if (demo.isDemo()) return demo.getParcel(id);
  return withTenant(session, async (c) => {
    const { rows } = await c.query(`${PARCEL_SELECT} WHERE p.id = $1`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  });
}

export interface VerificationRow {
  id: string;
  condition: ConditionBand;
  notes: string;
  photos: string[];
  at: string;
  ecologist: string;
  lng: number;
  lat: number;
}

export async function listVerifications(
  session: Session,
  parcelId: string,
): Promise<VerificationRow[]> {
  if (demo.isDemo()) return demo.listVerifications(parcelId);
  return withTenant(session, async (c) => {
    const { rows } = await c.query(
      `SELECT v.id, v.condition, v.notes, v.photos,
              to_char(v.at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS at,
              u.name AS ecologist,
              ST_X(v.geom) AS lng, ST_Y(v.geom) AS lat
       FROM verification v JOIN app_user u ON u.id = v.ecologist_id
       WHERE v.parcel_id = $1 ORDER BY v.at DESC`,
      [parcelId],
    );
    return rows.map((r) => ({
      id: r.id,
      condition: r.condition,
      notes: r.notes,
      photos: r.photos ?? [],
      at: r.at,
      ecologist: r.ecologist,
      lng: Number(r.lng),
      lat: Number(r.lat),
    }));
  });
}

export interface SurveyTaskRow {
  id: string;
  parcelId: string;
  parcelName: string;
  habitatType: string;
  reason: string;
  status: string;
  createdAt: string;
}

export async function listSurveyTasks(
  session: Session,
  status?: string,
): Promise<SurveyTaskRow[]> {
  if (demo.isDemo()) return demo.listSurveyTasks(status);
  return withTenant(session, async (c) => {
    const { rows } = await c.query(
      `SELECT s.id, s.parcel_id, p.name AS parcel_name, p.habitat_type,
              s.reason, s.status,
              to_char(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
       FROM survey_task s JOIN parcel p ON p.id = s.parcel_id
       ${status ? "WHERE s.status = $1" : ""}
       ORDER BY s.created_at DESC`,
      status ? [status] : [],
    );
    return rows.map((r) => ({
      id: r.id,
      parcelId: r.parcel_id,
      parcelName: r.parcel_name,
      habitatType: r.habitat_type,
      reason: r.reason,
      status: r.status,
      createdAt: r.created_at,
    }));
  });
}

/**
 * Field verifications for the whole portfolio, grouped by parcel and placed on
 * the management-period timeline, so the dashboard can recalibrate each parcel's
 * status against ground truth (shared correctedConditionAt).
 */
export async function fieldPointsByParcel(
  session: Session,
): Promise<Record<string, FieldPoint[]>> {
  if (demo.isDemo()) return demo.fieldPointsByParcel();
  return withTenant(session, async (c) => {
    const { rows } = await c.query(
      `SELECT v.parcel_id,
              v.condition,
              to_char(v.at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS at,
              to_char(p.baseline_date, 'YYYY-MM-DD') AS baseline
       FROM verification v JOIN parcel p ON p.id = v.parcel_id`,
    );
    const out: Record<string, FieldPoint[]> = {};
    for (const r of rows) {
      (out[r.parcel_id] ??= []).push(
        fieldPointFromVerification(r.baseline, r.at, r.condition as ConditionBand),
      );
    }
    return out;
  });
}

export async function openTaskForParcel(
  session: Session,
  parcelId: string,
): Promise<SurveyTaskRow | null> {
  const tasks = await listSurveyTasks(session);
  return (
    tasks.find((t) => t.parcelId === parcelId && t.status !== "completed" && t.status !== "cancelled") ??
    null
  );
}

export async function createSurveyTask(
  session: Session,
  parcelId: string,
  reason: string,
): Promise<string> {
  if (demo.isDemo()) return demo.createSurveyTask(parcelId, reason);
  return withTenant(session, async (c) => {
    const { rows } = await c.query(
      `INSERT INTO survey_task (parcel_id, reason, status) VALUES ($1, $2, 'open') RETURNING id`,
      [parcelId, reason],
    );
    return rows[0].id as string;
  });
}

export interface PortfolioSummary {
  total: number;
  atRisk: number;
  onTrack: number;
  openTasks: number;
  totalAreaHa: number;
}

export async function portfolioSummary(session: Session): Promise<PortfolioSummary> {
  if (demo.isDemo()) return demo.portfolioSummary();
  return withTenant(session, async (c) => {
    const { rows } = await c.query(`
      SELECT
        COUNT(DISTINCT p.id)::int AS total,
        COALESCE(SUM(p.area_ha), 0) AS area,
        COUNT(DISTINCT p.id) FILTER (WHERE f.status = 'at_risk')::int AS at_risk,
        COUNT(DISTINCT p.id) FILTER (WHERE f.status = 'on_track')::int AS on_track
      FROM parcel p
      LEFT JOIN LATERAL (
        SELECT status FROM trajectory_flag tf
        WHERE tf.parcel_id = p.id ORDER BY tf.detected_at DESC LIMIT 1
      ) f ON true
    `);
    const tasks = await c.query(
      `SELECT COUNT(*)::int AS n FROM survey_task WHERE status IN ('open','in_progress')`,
    );
    const r = rows[0];
    return {
      total: r.total,
      atRisk: r.at_risk,
      onTrack: r.on_track,
      openTasks: tasks.rows[0].n,
      totalAreaHa: Math.round(Number(r.area) * 100) / 100,
    };
  });
}
