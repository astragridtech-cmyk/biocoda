import { describe, it, expect } from "vitest";
import { MockEoHabitatAdapter, DEMO_NOW } from "./eo.js";
import { parcelProfile } from "@biocoda/shared";

// Pick representative parcel ids whose profiles cover each kind.
function findId(kind: string): string {
  for (let i = 0; i < 5000; i++) {
    const id = `parcel-${i}`;
    if (parcelProfile(id).kind === kind) return id;
  }
  throw new Error(`no parcel found for kind ${kind}`);
}

const baselines: Record<string, string> = {};
const ids = {
  improving: findId("improving"),
  plateau: findId("plateau"),
  declining: findId("declining"),
  stable_good: findId("stable_good"),
};
for (const id of Object.values(ids)) {
  // Baseline 8 years before the demo clock so trajectories have matured.
  baselines[id] = "2018-06-01T00:00:00Z";
}

const eo = new MockEoHabitatAdapter(baselines, DEMO_NOW);

describe("MockEoHabitatAdapter", () => {
  it("is deterministic", async () => {
    const a = await eo.trajectoryStatus(ids.improving);
    const b = await eo.trajectoryStatus(ids.improving);
    expect(a).toEqual(b);
  });

  it("flags declining parcels at_risk", async () => {
    const flag = await eo.trajectoryStatus(ids.declining);
    expect(flag.status).toBe("at_risk");
    expect(flag.gap).toBeLessThan(0);
  });

  it("flags plateaued parcels at_risk once the requirement outpaces them", async () => {
    const flag = await eo.trajectoryStatus(ids.plateau);
    expect(flag.status).toBe("at_risk");
  });

  it("keeps improving and stable-good parcels on_track", async () => {
    expect((await eo.trajectoryStatus(ids.improving)).status).toBe("on_track");
    expect((await eo.trajectoryStatus(ids.stable_good)).status).toBe("on_track");
  });

  it("returns a condition series anchored at/after baseline", async () => {
    const series = await eo.getConditionSeries(
      ids.improving,
      "2018-06-01T00:00:00Z",
      DEMO_NOW.toISOString(),
    );
    expect(series.length).toBeGreaterThan(20);
    expect(series.every((p) => p.value >= 0 && p.value <= 3)).toBe(true);
    expect(series.every((p) => p.source === "eo")).toBe(true);
  });
});
