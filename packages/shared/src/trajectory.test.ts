import { describe, it, expect } from "vitest";
import {
  requiredConditionAt,
  requiredCurve,
  classify,
  AT_RISK_MARGIN,
  MANAGEMENT_PERIOD_YEARS,
} from "./trajectory.js";
import { scoreToBand, BAND_SCORE } from "./condition.js";

const ramp = {
  baselineCondition: "poor" as const,
  targetCondition: "good" as const,
  targetYear: 10,
};

describe("requiredConditionAt", () => {
  it("starts at the baseline score in year 0", () => {
    expect(requiredConditionAt(ramp, 0)).toBe(BAND_SCORE.poor);
  });

  it("reaches the target score at the target year", () => {
    expect(requiredConditionAt(ramp, 10)).toBe(BAND_SCORE.good);
  });

  it("holds flat at target after the target year", () => {
    expect(requiredConditionAt(ramp, 25)).toBe(BAND_SCORE.good);
  });

  it("interpolates linearly mid-ramp", () => {
    // poor=1 -> good=3 over 10y => +0.2/yr; year 5 => 2.0
    expect(requiredConditionAt(ramp, 5)).toBeCloseTo(2.0, 6);
  });
});

describe("requiredCurve", () => {
  it("spans the full management period inclusive of year 0", () => {
    const curve = requiredCurve(ramp);
    expect(curve).toHaveLength(MANAGEMENT_PERIOD_YEARS + 1);
    expect(curve[0]).toEqual({ year: 0, required: BAND_SCORE.poor });
  });
});

describe("classify", () => {
  it("flags at_risk when observed sits beyond the margin below required", () => {
    const required = requiredConditionAt(ramp, 5); // 2.0
    const res = classify(ramp, 5, required - AT_RISK_MARGIN - 0.01);
    expect(res.status).toBe("at_risk");
    expect(res.gap).toBeLessThan(0);
  });

  it("stays on_track within the noise margin", () => {
    const required = requiredConditionAt(ramp, 5);
    const res = classify(ramp, 5, required - AT_RISK_MARGIN + 0.01);
    expect(res.status).toBe("on_track");
  });
});

describe("scoreToBand", () => {
  it("maps the 0-3 axis back to Defra bands", () => {
    expect(scoreToBand(1.0)).toBe("poor");
    expect(scoreToBand(2.0)).toBe("moderate");
    expect(scoreToBand(2.9)).toBe("good");
  });
});
