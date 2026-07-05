import { describe, it, expect } from "vitest";
import {
  correctedConditionAt,
  managementYear,
  fieldPointFromVerification,
  RECAL_HALF_LIFE_YEARS,
  type FieldPoint,
} from "./recalibrate.js";

// A flat model estimate of 2.0 at every year, so corrections are easy to read.
const flat = () => 2.0;

describe("correctedConditionAt", () => {
  it("returns the model estimate when there are no field points", () => {
    expect(correctedConditionAt(flat, 5, [])).toBe(2.0);
  });

  it("passes exactly through a verified point at the visit year", () => {
    const fields: FieldPoint[] = [{ year: 5, score: 3 }];
    expect(correctedConditionAt(flat, 5, fields)).toBeCloseTo(3.0, 6);
  });

  it("decays the correction by half every half-life", () => {
    const fields: FieldPoint[] = [{ year: 5, score: 3 }]; // correction = +1
    const oneHalfLife = correctedConditionAt(flat, 5 + RECAL_HALF_LIFE_YEARS, fields);
    expect(oneHalfLife).toBeCloseTo(2.5, 6); // model 2.0 + 0.5 residual
  });

  it("does not apply a field point that is in the future of the query year", () => {
    const fields: FieldPoint[] = [{ year: 8, score: 1 }];
    expect(correctedConditionAt(flat, 5, fields)).toBe(2.0);
  });

  it("uses the most recent prior verification when several exist", () => {
    const fields: FieldPoint[] = [
      { year: 2, score: 1 },
      { year: 6, score: 3 },
    ];
    // At year 6 the later point anchors it exactly.
    expect(correctedConditionAt(flat, 6, fields)).toBeCloseTo(3.0, 6);
  });

  it("clamps the corrected value to the 0-3 axis", () => {
    const fields: FieldPoint[] = [{ year: 1, score: 3 }];
    const high = () => 2.9;
    expect(correctedConditionAt(high, 1, fields)).toBeLessThanOrEqual(3);
  });
});

describe("managementYear", () => {
  it("is zero at the baseline date", () => {
    expect(managementYear("2026-01-01", "2026-01-01")).toBeCloseTo(0, 3);
  });

  it("is about one year after twelve months", () => {
    expect(managementYear("2026-01-01", "2027-01-01")).toBeCloseTo(1, 1);
  });
});

describe("fieldPointFromVerification", () => {
  it("maps a band to its score at the right management year", () => {
    const fp = fieldPointFromVerification("2026-01-01", "2028-01-01", "good");
    expect(fp.score).toBe(3);
    expect(fp.year).toBeCloseTo(2, 1);
  });
});
