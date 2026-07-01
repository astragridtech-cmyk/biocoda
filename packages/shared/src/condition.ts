import { z } from "zod";

/**
 * Habitat condition vocabulary.
 *
 * The Defra Biodiversity Metric scores a parcel's *condition* on a three-band
 * scale. BioCoda represents condition on a continuous 0–3 axis so EO signals
 * and field assessments can be compared against a required trajectory, while
 * still mapping cleanly back to the Metric's discrete bands.
 *
 *   Poor      ≈ 1.0
 *   Moderate  ≈ 2.0
 *   Good      ≈ 3.0
 *
 * EO indicators (NDVI, sward diversity, bare-soil fraction, …) are *decision
 * support*: they drive the EO-derived condition estimate and the on-track /
 * at-risk flag. A field verification is authoritative and overrides EO.
 */

export const ConditionBandSchema = z.enum(["poor", "moderate", "good"]);
export type ConditionBand = z.infer<typeof ConditionBandSchema>;

/** Numeric anchor for each Defra condition band on the 0–3 axis. */
export const BAND_SCORE: Record<ConditionBand, number> = {
  poor: 1,
  moderate: 2,
  good: 3,
};

/** Map a continuous 0–3 condition score back to the nearest Defra band. */
export function scoreToBand(score: number): ConditionBand {
  if (score < 1.5) return "poor";
  if (score < 2.5) return "moderate";
  return "good";
}

/** Source of a condition observation. */
export const ConditionSourceSchema = z.enum(["eo", "field"]);
export type ConditionSource = z.infer<typeof ConditionSourceSchema>;

/**
 * EO indicators the worker can surface alongside the headline condition score.
 * `condition_score` is the headline 0–3 estimate; the rest are raw indicators.
 */
export const ConditionMetricSchema = z.enum([
  "condition_score",
  "ndvi",
  "sward_diversity",
  "bare_soil_fraction",
  "canopy_cover",
]);
export type ConditionMetric = z.infer<typeof ConditionMetricSchema>;

/** A single observation of one metric for one parcel at a point in time. */
export const ConditionPointSchema = z.object({
  parcelId: z.string(),
  metric: ConditionMetricSchema,
  value: z.number(),
  /** ISO 8601 timestamp. */
  capturedAt: z.string(),
  source: ConditionSourceSchema,
});
export type ConditionPoint = z.infer<typeof ConditionPointSchema>;

export const TrajectoryStatusSchema = z.enum(["on_track", "at_risk"]);
export type TrajectoryStatus = z.infer<typeof TrajectoryStatusSchema>;

/** Worker verdict for a parcel: where it sits vs. the required curve. */
export const TrajectoryFlagSchema = z.object({
  parcelId: z.string(),
  status: TrajectoryStatusSchema,
  /** Management-period year the assessment refers to (0 = baseline). */
  year: z.number().int().nonnegative(),
  /** Latest EO-estimated condition score (0–3). */
  actual: z.number(),
  /** Required condition score at this year per the target trajectory (0–3). */
  required: z.number(),
  /** actual − required; negative means behind the curve. */
  gap: z.number(),
  detectedAt: z.string(),
});
export type TrajectoryFlag = z.infer<typeof TrajectoryFlagSchema>;
