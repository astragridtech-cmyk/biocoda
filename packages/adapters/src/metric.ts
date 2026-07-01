import { z } from "zod";
import { BAND_SCORE, parcelProfile, type ConditionBand } from "@biocoda/shared";

/**
 * Defra Biodiversity Metric link.
 *
 * BioCoda does NOT reimplement the Metric (out of scope, spec §1.4). It
 * links to it: given a parcel's `metricRef`, resolve the baseline/target units
 * and conditions recorded in the development's Metric. Real wiring points this
 * at a Defra Biodiversity Metric data export; the mock returns fixtures.
 */

export const MetricBaselineSchema = z.object({
  metricRef: z.string(),
  habitatType: z.string(),
  baselineCondition: z.enum(["poor", "moderate", "good"]),
  targetCondition: z.enum(["poor", "moderate", "good"]),
  /** Biodiversity units at baseline (pre-intervention). */
  baselineUnits: z.number().nonnegative(),
  /** Biodiversity units the parcel is contracted to deliver. */
  targetUnits: z.number().nonnegative(),
  /** Year within the management period the target must be reached. */
  byYear: z.number().int().positive(),
});
export type MetricBaseline = z.infer<typeof MetricBaselineSchema>;

export interface MetricAdapter {
  baseline(metricRef: string): Promise<MetricBaseline>;
}

/**
 * Deterministic mock. A `metricRef` of the form `BM-<parcelId>` resolves back
 * to that parcel's profile, so Metric figures line up with the seeded targets
 * and the EO trajectory. Units are a simple area×condition proxy: illustrative,
 * not the real Metric calculation.
 */
export class MockMetricAdapter implements MetricAdapter {
  constructor(
    /** parcelId -> { habitatType, areaHa } from the seeded parcels. */
    private readonly parcels: Record<string, { habitatType: string; areaHa: number }>,
  ) {}

  async baseline(metricRef: string): Promise<MetricBaseline> {
    const parcelId = metricRef.replace(/^BM-/, "");
    const parcel = this.parcels[parcelId];
    if (!parcel) throw new Error(`unknown metricRef: ${metricRef}`);
    const profile = parcelProfile(parcelId);
    return MetricBaselineSchema.parse({
      metricRef,
      habitatType: parcel.habitatType,
      baselineCondition: profile.baselineCondition,
      targetCondition: profile.targetCondition,
      baselineUnits: units(parcel.areaHa, profile.baselineCondition),
      targetUnits: units(parcel.areaHa, profile.targetCondition),
      byYear: profile.byYear,
    });
  }
}

/** Illustrative units proxy: area (ha) × condition multiplier. */
function units(areaHa: number, condition: ConditionBand): number {
  return Math.round(areaHa * BAND_SCORE[condition] * 2 * 10) / 10;
}
