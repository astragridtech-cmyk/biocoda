import { BAND_SCORE, type ConditionBand, type TrajectoryStatus } from "./condition.js";

/**
 * Required-trajectory model.
 *
 * BNG secures a habitat at a baseline condition and requires it to reach a
 * target condition by a target year (typically within the 30-year period).
 * The "required" curve is the minimum condition a parcel must hold at any
 * given year: a linear ramp from baseline → target up to `targetYear`, then
 * flat at the target for the remainder of the management period.
 *
 * A parcel is `at_risk` when its observed condition falls more than
 * `AT_RISK_MARGIN` below the required value for the current year: enough
 * tolerance to ignore noise, tight enough to catch a genuine decline early.
 */

export const MANAGEMENT_PERIOD_YEARS = 30;

/** How far below the required curve a parcel may sit before it is flagged. */
export const AT_RISK_MARGIN = 0.35;

export interface RequiredTrajectoryInput {
  baselineCondition: ConditionBand;
  targetCondition: ConditionBand;
  /** Year by which the target condition must be reached (1..30). */
  targetYear: number;
}

/** Required condition score (0–3) at a given management-period year. */
export function requiredConditionAt(
  input: RequiredTrajectoryInput,
  year: number,
): number {
  const start = BAND_SCORE[input.baselineCondition];
  const end = BAND_SCORE[input.targetCondition];
  const ty = Math.max(1, input.targetYear);
  if (year <= 0) return start;
  if (year >= ty) return end;
  return start + ((end - start) * year) / ty;
}

/** The full required curve, one point per integer year over the period. */
export function requiredCurve(
  input: RequiredTrajectoryInput,
  periodYears: number = MANAGEMENT_PERIOD_YEARS,
): { year: number; required: number }[] {
  const out: { year: number; required: number }[] = [];
  for (let y = 0; y <= periodYears; y++) {
    out.push({ year: y, required: requiredConditionAt(input, y) });
  }
  return out;
}

/** Classify an observed condition against the required curve for a year. */
export function classify(
  input: RequiredTrajectoryInput,
  year: number,
  observed: number,
): { status: TrajectoryStatus; required: number; gap: number } {
  const required = requiredConditionAt(input, year);
  const gap = observed - required;
  return {
    status: gap < -AT_RISK_MARGIN ? "at_risk" : "on_track",
    required,
    gap,
  };
}
