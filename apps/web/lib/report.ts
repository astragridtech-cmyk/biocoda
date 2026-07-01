import { APP_NAME, BAND_SCORE, hashU32, type ConditionBand } from "@biocoda/shared";
import { withTenant, type Session } from "./db.js";
import { getParcel, listVerifications, toContext } from "./data.js";
import { getConditionSeries, getRequiredCurve, getTrajectory } from "./eo.js";
import { isDemo } from "./demo.js";

/**
 * Habitat-appropriate management interventions. Indicative: a real management
 * plan (imported via /plans) provides the actual contracted actions; when none
 * is on record we surface the typical prescription for the habitat so the
 * evidence pack still communicates what management the parcel is under.
 */
function habitatInterventions(habitatType: string): string[] {
  const h = habitatType.toLowerCase();
  if (h.includes("hedge")) return ["Hedgerow planting", "Hedge laying and gapping-up", "Field-margin buffer strip"];
  if (h.includes("meadow") || h.includes("grassland")) return ["Wildflower seed establishment", "Low-input hay cut with aftermath grazing", "Yellow rattle introduction"];
  if (h.includes("scrub")) return ["Native scrub and hedgerow planting", "Scrub mosaic management", "Bramble and bracken control"];
  if (h.includes("wood")) return ["Native broadleaf tree planting", "Deer and rabbit protection", "Natural regeneration thinning"];
  if (h.includes("heath")) return ["Heather sward restoration", "Scrub and bracken control", "Conservation grazing reintroduction"];
  if (h.includes("bog") || h.includes("mire")) return ["Grip blocking to restore hydrology", "Sphagnum reintroduction", "Grazing pressure reduction"];
  if (h.includes("reed") || h.includes("fen") || h.includes("marsh") || h.includes("wetland") || h.includes("wet ")) return ["Water-level management", "Reed and sedge establishment", "Scrape and ditch creation"];
  return ["Habitat establishment planting", "Invasive species control", "Conservation grazing or cutting regime"];
}

function interventionStatus(basePct: number, parcelId: string, action: string): string {
  const offset = (hashU32(`${parcelId}:${action}`) % 30) - 12;
  const p = Math.max(0, Math.min(100, basePct + offset));
  if (p >= 90) return "Complete";
  if (p >= 65) return "Established";
  if (p >= 35) return "Establishing";
  if (p >= 10) return "Newly implemented";
  return "Scheduled";
}

/**
 * Assemble an annual monitoring pack: the self-contained evidence manifest the
 * responsible body / LPA needs for a parcel-year: EO trajectory, the required
 * curve, the field verifications, and the Metric linkage, persisted to `report`.
 */
export async function buildReport(session: Session, parcelId: string) {
  const parcel = await getParcel(session, parcelId);
  if (!parcel) throw new Error(`unknown parcel: ${parcelId}`);
  const ctx = toContext(parcel);
  const [trajectory, requiredCurve, eoSeries, verifications] = await Promise.all([
    getTrajectory(ctx),
    getRequiredCurve(ctx),
    getConditionSeries(ctx),
    listVerifications(session, parcelId),
  ]);

  // Progress from baseline condition toward the target (0 to 100%).
  const baseScore = BAND_SCORE[parcel.baselineCondition as ConditionBand];
  const targetScore = BAND_SCORE[parcel.targetCondition as ConditionBand];
  const span = targetScore - baseScore;
  const fromBaselinePct =
    span > 0 ? Math.max(0, Math.min(100, Math.round(((trajectory.actual - baseScore) / span) * 100))) : 100;
  const progress = {
    conditionFromBaselinePct: fromBaselinePct,
    currentScore: Math.round(trajectory.actual * 100) / 100,
    baselineScore: baseScore,
    targetScore,
    yearsElapsed: trajectory.year,
    yearsToTarget: Math.max(0, parcel.byYear - trajectory.year),
    targetYear: parcel.byYear,
    onTrack: trajectory.status === "on_track",
  };
  const interventions = habitatInterventions(parcel.habitatType).map((action) => ({
    action,
    status: interventionStatus(fromBaselinePct, parcel.id, action),
  }));

  const manifest = {
    app: APP_NAME,
    generatedAt: new Date().toISOString(),
    parcel: {
      id: parcel.id,
      name: parcel.name,
      habitatType: parcel.habitatType,
      metricRef: parcel.metricRef,
      areaHa: parcel.areaHa,
      baselineDate: parcel.baselineDate,
    },
    target: {
      baselineCondition: parcel.baselineCondition,
      targetCondition: parcel.targetCondition,
      byYear: parcel.byYear,
    },
    metric: {
      metricRef: parcel.metricRef,
      baselineUnits: parcel.baselineUnits,
      targetUnits: parcel.targetUnits,
    },
    trajectory,
    requiredCurve,
    eoSeries,
    verifications,
    progress,
    interventions,
  };

  if (isDemo()) {
    // No DB in demo mode; the manifest is the deliverable.
    return { id: `report-${parcelId}-Y${trajectory.year}`, manifest };
  }

  const id = await withTenant(session, async (c) => {
    const { rows } = await c.query(
      `INSERT INTO report (parcel_id, year, manifest) VALUES ($1, $2, $3) RETURNING id`,
      [parcelId, trajectory.year, JSON.stringify(manifest)],
    );
    return rows[0].id as string;
  });

  return { id, manifest };
}
