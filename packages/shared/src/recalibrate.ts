import { BAND_SCORE, type ConditionBand } from "./condition.js";
import { MANAGEMENT_PERIOD_YEARS } from "./trajectory.js";

/**
 * Field recalibration of the observed-condition curve.
 *
 * Earth observation gives a continuous but estimated condition signal. A field
 * verification is authoritative: an ecologist stood on the parcel and scored
 * it. When one exists, the observed curve must (a) pass exactly through that
 * verified point and (b) carry the correction forward, fading as fresh Earth
 * observation reasserts itself, so the whole trajectory bends toward ground
 * truth rather than ignoring it.
 *
 * The correction is the difference between the verified score and what the
 * model estimated at the visit, applied on top of the model estimate and
 * decayed by a half-life. At the visit year the decay is 1, so the curve hits
 * the verified score exactly; each half-life later the residual halves.
 */

/** A verified condition observation placed on the management-period timeline. */
export interface FieldPoint {
  /** Management-period year of the visit (0 = baseline; may be fractional). */
  year: number;
  /** Verified condition score on the 0-3 axis. */
  score: number;
}

/** How quickly a field correction fades back toward the Earth observation model. */
export const RECAL_HALF_LIFE_YEARS = 6;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Management-period year for a verification, from the parcel baseline date to
 * the observation date. Fractional; clamped to the management period.
 */
export function managementYear(baselineDate: string | Date, at: string | Date): number {
  const b = new Date(baselineDate).getTime();
  const t = new Date(at).getTime();
  if (!Number.isFinite(b) || !Number.isFinite(t)) return 0;
  const years = (t - b) / (365.25 * 24 * 60 * 60 * 1000);
  return clamp(years, 0, MANAGEMENT_PERIOD_YEARS);
}

/** Turn a verified band + date into a FieldPoint against the parcel baseline. */
export function fieldPointFromVerification(
  baselineDate: string | Date,
  at: string | Date,
  condition: ConditionBand,
): FieldPoint {
  return { year: managementYear(baselineDate, at), score: BAND_SCORE[condition] };
}

/**
 * Observed condition at `year`, corrected toward the most recent field
 * verification at or before that year. With no field points it returns the
 * model estimate unchanged, so callers can always route through this.
 */
export function correctedConditionAt(
  modelAt: (year: number) => number,
  year: number,
  fields: FieldPoint[],
): number {
  let prior: FieldPoint | null = null;
  for (const f of fields) {
    if (f.year <= year && (!prior || f.year > prior.year)) prior = f;
  }
  if (!prior) return modelAt(year);
  const correction = prior.score - modelAt(prior.year);
  const decay = Math.pow(0.5, (year - prior.year) / RECAL_HALF_LIFE_YEARS);
  return clamp(modelAt(year) + correction * decay, 0, 3);
}
