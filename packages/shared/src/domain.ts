import { z } from "zod";
import { PointSchema, PolygonSchema } from "./geo.js";
import {
  ConditionBandSchema,
  ConditionPointSchema,
  TrajectoryFlagSchema,
} from "./condition.js";

/**
 * Core domain entities. Field names mirror the database columns (snake_case in
 * SQL, camelCase here) so the API layer is a thin mapping.
 */

/** Organisation types that hold a stake in a parcel's 30-year obligation. */
export const TenantTypeSchema = z.enum([
  "responsible_body",
  "lpa",
  "developer",
]);
export type TenantType = z.infer<typeof TenantTypeSchema>;

/** A login role. Field ecologists are cross-org surveyors. */
export const RoleSchema = z.enum([
  "responsible_body",
  "lpa",
  "developer",
  "ecologist",
]);
export type Role = z.infer<typeof RoleSchema>;

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: TenantTypeSchema,
});
export type Tenant = z.infer<typeof TenantSchema>;

/**
 * A BNG habitat parcel. `metricRef` ties it back to the row in the development's
 * Defra Biodiversity Metric that this parcel was created/enhanced to satisfy.
 */
export const ParcelSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  /** Habitat type label, e.g. "Lowland meadow", "Mixed scrub". */
  habitatType: z.string(),
  /** Reference into the development's Defra Metric (adapter resolves it). */
  metricRef: z.string(),
  /** Parcel boundary, GeoJSON Polygon (SRID 4326). */
  geom: PolygonSchema,
  areaHa: z.number().positive(),
  /** Year 0 of this parcel's management period (ISO date). */
  baselineDate: z.string(),
});
export type Parcel = z.infer<typeof ParcelSchema>;

/** The condition/units a parcel must reach, derived from the Metric. */
export const TargetSchema = z.object({
  id: z.string(),
  parcelId: z.string(),
  baselineCondition: ConditionBandSchema,
  targetCondition: ConditionBandSchema,
  /** Biodiversity units the parcel is contracted to deliver. */
  targetUnits: z.number().nonnegative(),
  /** Year within the management period the target must be reached (1..30). */
  byYear: z.number().int().positive(),
});
export type Target = z.infer<typeof TargetSchema>;

/** An authoritative field assessment captured by an ecologist on-site. */
export const VerificationSchema = z.object({
  id: z.string(),
  parcelId: z.string(),
  ecologistId: z.string(),
  condition: ConditionBandSchema,
  /** Free-text condition-assessment notes (habitat-condition criteria). */
  notes: z.string().default(""),
  /** Storage keys / URLs for geotagged photos. */
  photos: z.array(z.string()).default([]),
  /** GPS location the assessment was captured at. */
  geom: PointSchema,
  /** ISO 8601 timestamp. */
  at: z.string(),
});
export type Verification = z.infer<typeof VerificationSchema>;

/** Status of a dispatched field-survey task. */
export const SurveyTaskStatusSchema = z.enum([
  "open",
  "in_progress",
  "completed",
  "cancelled",
]);
export type SurveyTaskStatus = z.infer<typeof SurveyTaskStatusSchema>;

/**
 * A targeted survey task, typically generated when EO flags a parcel at_risk,
 * then picked up in the ecologist mobile app.
 */
export const SurveyTaskSchema = z.object({
  id: z.string(),
  parcelId: z.string(),
  reason: z.string(),
  status: SurveyTaskStatusSchema,
  createdAt: z.string(),
  /** Set when an ecologist files the verification that closes the task. */
  verificationId: z.string().nullable().default(null),
});
export type SurveyTask = z.infer<typeof SurveyTaskSchema>;

/** An exported annual monitoring pack (evidence for the responsible body/LPA). */
export const ReportSchema = z.object({
  id: z.string(),
  parcelId: z.string(),
  year: z.number().int().nonnegative(),
  /** Self-contained evidence manifest (see ReportManifest). */
  manifest: z.unknown(),
  createdAt: z.string(),
});
export type Report = z.infer<typeof ReportSchema>;

/** Shape of the JSON manifest embedded in a Report. */
export const ReportManifestSchema = z.object({
  app: z.string(),
  generatedAt: z.string(),
  parcel: ParcelSchema,
  target: TargetSchema,
  metric: z.object({
    metricRef: z.string(),
    baselineUnits: z.number(),
    targetUnits: z.number(),
  }),
  trajectory: TrajectoryFlagSchema,
  requiredCurve: z.array(z.object({ year: z.number(), required: z.number() })),
  eoSeries: z.array(ConditionPointSchema),
  verifications: z.array(VerificationSchema),
});
export type ReportManifest = z.infer<typeof ReportManifestSchema>;
