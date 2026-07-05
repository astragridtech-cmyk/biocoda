import { hashU32, observedConditionAt, parcelProfile } from "./profile.js";
import { classify, requiredConditionAt } from "./trajectory.js";
import { correctedConditionAt, type FieldPoint } from "./recalibrate.js";

/**
 * Per-parcel assessment at a management year. One source of truth so the
 * dashboard, the digest, and the notification generator never disagree.
 */
export type ParcelStatusKind = "track" | "risk" | "awaiting";

export interface ParcelAssessment {
  kind: ParcelStatusKind;
  actual: number;
  required: number;
  gap: number;
  code: string;
}

/** Stable display reference, e.g. "BC-1574". */
export function parcelCode(id: string): string {
  return `BC-${1000 + (hashU32(id) % 900)}`;
}

/** Roughly 1 in 7 parcels have no EO baseline captured yet. */
export function isAwaitingEo(id: string): boolean {
  return hashU32(id) % 7 === 0;
}

export function assessParcel(
  id: string,
  year: number,
  fields: FieldPoint[] = [],
): ParcelAssessment {
  const code = parcelCode(id);
  if (isAwaitingEo(id)) return { kind: "awaiting", actual: 0, required: 0, gap: 0, code };
  const prof = parcelProfile(id);
  const t = {
    baselineCondition: prof.baselineCondition,
    targetCondition: prof.targetCondition,
    targetYear: prof.byYear,
  };
  // Field verifications are authoritative: they recalibrate the observed value.
  const actual = correctedConditionAt((y) => observedConditionAt(id, y), year, fields);
  const required = requiredConditionAt(t, year);
  const { status, gap } = classify(t, year, actual);
  return { kind: status === "at_risk" ? "risk" : "track", actual, required, gap, code };
}
