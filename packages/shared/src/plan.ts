import { z } from "zod";
import { ConditionBandSchema } from "./condition.js";

/**
 * Plan-ingestion schema.
 *
 * The structured shape extracted from a Biodiversity / Habitat Management Plan
 * (HMMP, LEMP, Biodiversity Gain Plan, BMP). Conditions reuse the Defra band
 * vocabulary so extracted targets line up with the EO trajectory and the Metric
 * linkage with no translation. Used as the Claude structured-output schema and
 * validated again on commit.
 */

export const PlanTypeSchema = z.enum(["HMMP", "LEMP", "BGP", "BMP", "other"]);
export type PlanType = z.infer<typeof PlanTypeSchema>;

/** Where in the source document a value came from. */
export const ProvenanceSchema = z.object({
  page: z.number().int().positive().nullable(),
  clause: z.string(),
  quote: z.string(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

/** A management action a parcel is contracted to receive. */
export const ManagementActionSchema = z.object({
  action: z.string(),
  /** Management-period years the action applies to (empty = every year). */
  scheduleYears: z.array(z.number().int().nonnegative()),
  notes: z.string(),
});
export type ManagementAction = z.infer<typeof ManagementActionSchema>;

export const MonitoringScheduleSchema = z.object({
  intervalYears: z.number().int().positive(),
  method: z.string(),
});
export type MonitoringSchedule = z.infer<typeof MonitoringScheduleSchema>;

export const ExtractedParcelSchema = z.object({
  /** The plan's own parcel reference or label, e.g. "P3", "Compartment 4a". */
  ref: z.string(),
  name: z.string(),
  habitatType: z.string(),
  areaHa: z.number().positive(),
  baselineCondition: ConditionBandSchema,
  targetCondition: ConditionBandSchema,
  /** Year within the management period the target must be reached. */
  byYear: z.number().int().positive(),
  /** Biodiversity units, if the plan states them; null otherwise. */
  targetUnits: z.number().nonnegative().nullable(),
  managementActions: z.array(ManagementActionSchema),
  monitoring: MonitoringScheduleSchema.nullable(),
  provenance: ProvenanceSchema,
});
export type ExtractedParcel = z.infer<typeof ExtractedParcelSchema>;

export const PlanMetadataSchema = z.object({
  planType: PlanTypeSchema,
  title: z.string(),
  siteName: z.string(),
  author: z.string(),
  /** Management period the plan runs for (years). */
  periodYears: z.number().int().positive(),
  preparedDate: z.string(),
});
export type PlanMetadata = z.infer<typeof PlanMetadataSchema>;

export const PlanExtractionSchema = z.object({
  plan: PlanMetadataSchema,
  parcels: z.array(ExtractedParcelSchema),
  /** Model self-assessed confidence, 0 to 1. */
  confidence: z.number().min(0).max(1),
  /** Anything ambiguous, assumed, or missing that a reviewer should check. */
  warnings: z.array(z.string()),
});
export type PlanExtraction = z.infer<typeof PlanExtractionSchema>;
