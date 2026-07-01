import { describe, it, expect } from "vitest";
import { PlanExtractionSchema } from "@biocoda/shared";
import { MockPlanIngestionAdapter, SAMPLE_EXTRACTION } from "./plan.js";

describe("MockPlanIngestionAdapter", () => {
  it("returns a schema-valid extraction", async () => {
    const out = await new MockPlanIngestionAdapter().extract({
      filename: "plan.pdf",
      mediaType: "application/pdf",
    });
    expect(() => PlanExtractionSchema.parse(out)).not.toThrow();
  });

  it("extracts the five Willowmere parcels with Defra bands", () => {
    expect(SAMPLE_EXTRACTION.parcels).toHaveLength(5);
    for (const p of SAMPLE_EXTRACTION.parcels) {
      expect(["poor", "moderate", "good"]).toContain(p.baselineCondition);
      expect(["poor", "moderate", "good"]).toContain(p.targetCondition);
      expect(p.byYear).toBeGreaterThan(0);
      expect(p.provenance.clause).not.toEqual("");
    }
  });

  it("leaves units null where the plan does not state them", () => {
    const p3 = SAMPLE_EXTRACTION.parcels.find((p) => p.ref === "P3");
    expect(p3?.targetUnits).toBeNull();
    expect(SAMPLE_EXTRACTION.warnings.length).toBeGreaterThan(0);
  });
});
