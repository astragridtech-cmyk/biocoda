import { PlanExtractionSchema, type PlanExtraction } from "@biocoda/shared";

/**
 * Plan ingestion source.
 *
 * Real wiring (later) points this at Claude (apps/web/lib/plan-extract.ts);
 * the Mock returns a deterministic sample so the whole flow is demonstrable
 * with no external keys. Swapping Mock for Real changes no calling code.
 */
export interface PlanIngestionInput {
  filename: string;
  /** application/pdf | text/plain. */
  mediaType: string;
  /** Plain-text content, when available. */
  text?: string;
  /** Base64 file content (for PDF), when available. */
  base64?: string;
}

export interface PlanIngestionAdapter {
  extract(input: PlanIngestionInput): Promise<PlanExtraction>;
}

/** A short, realistic HMMP used by the keyless demo and the Mock adapter. */
export const SAMPLE_PLAN_TEXT = `HABITAT MANAGEMENT AND MONITORING PLAN (HMMP)
Site: Willowmere, Downshire. Prepared for the Natural Trust Responsible Body.
Plan period: 30 years. Prepared June 2026 by Fenwick Ecology Ltd.

5. Habitat parcels, baseline and target condition
5.1 P1 Willowmere Meadow (2.4 ha), lowland meadow. Baseline condition Poor.
    Target condition Good by year 10 (9.6 biodiversity units). Annual hay cut and
    rake, no fertiliser; aftermath grazing years 3 to 30. Monitor by NVC quadrats
    every 5 years.
5.2 P2 North Scrub (0.8 ha), mixed scrub. Baseline Moderate, target Good by year 8
    (4.8 units). Rotational coppice, control bramble. Fixed-point photography every 3 years.
5.3 P3 Willow Carr (1.6 ha), wet woodland. Baseline Poor, target Moderate by year 15.
    Maintain wet conditions, remove non-native species. Monitor every 5 years.
5.4 P4 Pond Margins (0.5 ha), reedbed. Baseline Poor, target Good by year 12
    (2.0 units). Manage water levels, cut reed in rotation. Monitor every 5 years.
5.5 P5 Boundary Hedgerow (0.3 ha), hedgerow. Baseline Moderate, target Good by year 6.
    Lay hedge years 1 to 3, trim on a 3-year rotation thereafter.`;

/** Deterministic extraction matching SAMPLE_PLAN_TEXT. */
export const SAMPLE_EXTRACTION: PlanExtraction = PlanExtractionSchema.parse({
  plan: {
    planType: "HMMP",
    title: "Willowmere Habitat Management and Monitoring Plan",
    siteName: "Willowmere, Downshire",
    author: "Fenwick Ecology Ltd",
    periodYears: 30,
    preparedDate: "2026-06",
  },
  confidence: 0.84,
  warnings: [
    "P3 Willow Carr: target units not stated in the plan; left blank for the reviewer.",
  ],
  parcels: [
    {
      ref: "P1",
      name: "Willowmere Meadow",
      habitatType: "Lowland meadow",
      areaHa: 2.4,
      baselineCondition: "poor",
      targetCondition: "good",
      byYear: 10,
      targetUnits: 9.6,
      managementActions: [
        { action: "Annual hay cut and rake; no fertiliser", scheduleYears: [], notes: "" },
        { action: "Aftermath grazing", scheduleYears: [], notes: "Years 3 to 30" },
      ],
      monitoring: { intervalYears: 5, method: "NVC quadrats" },
      provenance: { page: null, clause: "5.1", quote: "Target condition Good by year 10 (9.6 biodiversity units)." },
    },
    {
      ref: "P2",
      name: "North Scrub",
      habitatType: "Mixed scrub",
      areaHa: 0.8,
      baselineCondition: "moderate",
      targetCondition: "good",
      byYear: 8,
      targetUnits: 4.8,
      managementActions: [
        { action: "Rotational coppice; control bramble", scheduleYears: [], notes: "" },
      ],
      monitoring: { intervalYears: 3, method: "Fixed-point photography" },
      provenance: { page: null, clause: "5.2", quote: "Baseline Moderate, target Good by year 8 (4.8 units)." },
    },
    {
      ref: "P3",
      name: "Willow Carr",
      habitatType: "Wet woodland",
      areaHa: 1.6,
      baselineCondition: "poor",
      targetCondition: "moderate",
      byYear: 15,
      targetUnits: null,
      managementActions: [
        { action: "Maintain wet conditions; remove non-native species", scheduleYears: [], notes: "" },
      ],
      monitoring: { intervalYears: 5, method: "Condition assessment" },
      provenance: { page: null, clause: "5.3", quote: "Baseline Poor, target Moderate by year 15." },
    },
    {
      ref: "P4",
      name: "Pond Margins",
      habitatType: "Reedbed",
      areaHa: 0.5,
      baselineCondition: "poor",
      targetCondition: "good",
      byYear: 12,
      targetUnits: 2.0,
      managementActions: [
        { action: "Manage water levels; cut reed in rotation", scheduleYears: [], notes: "" },
      ],
      monitoring: { intervalYears: 5, method: "Condition assessment" },
      provenance: { page: null, clause: "5.4", quote: "Baseline Poor, target Good by year 12 (2.0 units)." },
    },
    {
      ref: "P5",
      name: "Boundary Hedgerow",
      habitatType: "Hedgerow",
      areaHa: 0.3,
      baselineCondition: "moderate",
      targetCondition: "good",
      byYear: 6,
      targetUnits: null,
      managementActions: [
        { action: "Lay hedge then trim on a 3-year rotation", scheduleYears: [1, 2, 3], notes: "Lay years 1 to 3" },
      ],
      monitoring: { intervalYears: 3, method: "Fixed-point photography" },
      provenance: { page: null, clause: "5.5", quote: "Baseline Moderate, target Good by year 6." },
    },
  ],
});

/**
 * Deterministic mock. Returns the Willowmere sample regardless of input, so the
 * review and commit flow works end to end without an API key.
 */
export class MockPlanIngestionAdapter implements PlanIngestionAdapter {
  async extract(_input: PlanIngestionInput): Promise<PlanExtraction> {
    void _input;
    return SAMPLE_EXTRACTION;
  }
}
