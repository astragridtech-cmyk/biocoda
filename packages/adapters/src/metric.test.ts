import { describe, it, expect } from "vitest";
import { MockMetricAdapter } from "./metric.js";
import { parcelProfile } from "@biocoda/shared";

const parcels = {
  "parcel-1": { habitatType: "Lowland meadow", areaHa: 2.5 },
};
const metric = new MockMetricAdapter(parcels);

describe("MockMetricAdapter", () => {
  it("resolves a metricRef back to its parcel profile", async () => {
    const base = await metric.baseline("BM-parcel-1");
    const profile = parcelProfile("parcel-1");
    expect(base.baselineCondition).toBe(profile.baselineCondition);
    expect(base.targetCondition).toBe(profile.targetCondition);
    expect(base.byYear).toBe(profile.byYear);
    expect(base.targetUnits).toBeGreaterThanOrEqual(base.baselineUnits);
  });

  it("throws on an unknown metricRef", async () => {
    await expect(metric.baseline("BM-nope")).rejects.toThrow();
  });
});
