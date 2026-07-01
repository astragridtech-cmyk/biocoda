import {
  classify,
  observedConditionAt,
  parcelProfile,
  scoreToBand,
  type ConditionPoint,
  type TrajectoryFlag,
} from "@biocoda/shared";

/**
 * EO habitat-condition source.
 *
 * Real wiring (later) points this at EarthDaily / Sentinel habitat-condition
 * classification with multi-year trajectory. Swapping the Mock for a Real
 * implementation must change *no calling code* (build doc §1.6).
 */
export interface EoHabitatAdapter {
  /** EO-estimated condition observations for a parcel within a date window. */
  getConditionSeries(
    parcelId: string,
    from: string,
    to: string,
  ): Promise<ConditionPoint[]>;
  /** Latest on-track / at-risk verdict for a parcel vs. its required curve. */
  trajectoryStatus(parcelId: string): Promise<TrajectoryFlag>;
}

/** Reference clock for the demo, so "current year" is reproducible. */
export const DEMO_NOW = new Date("2026-06-01T00:00:00Z");

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function yearsBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / MS_PER_YEAR;
}

/**
 * Deterministic in-memory EO source for local demos and tests. Generates a
 * quarterly condition series and a trajectory verdict purely from `parcelId`,
 * mirroring the Python worker (apps/eo-worker). Needs each parcel's baseline
 * date to anchor year 0.
 */
export class MockEoHabitatAdapter implements EoHabitatAdapter {
  constructor(
    /** parcelId -> baseline (year 0) ISO date. */
    private readonly baselineDates: Record<string, string>,
    private readonly now: Date = DEMO_NOW,
  ) {}

  private baseline(parcelId: string): string {
    const d = this.baselineDates[parcelId];
    if (!d) throw new Error(`unknown parcel: ${parcelId}`);
    return d;
  }

  async getConditionSeries(
    parcelId: string,
    from: string,
    to: string,
  ): Promise<ConditionPoint[]> {
    const baseline = this.baseline(parcelId);
    const out: ConditionPoint[] = [];
    // One observation per quarter from `from` to `to`.
    const start = new Date(from).getTime();
    const end = new Date(to).getTime();
    const stepMs = MS_PER_YEAR / 4;
    for (let t = start; t <= end; t += stepMs) {
      const iso = new Date(t).toISOString();
      const year = yearsBetween(baseline, iso);
      if (year < 0) continue;
      out.push({
        parcelId,
        metric: "condition_score",
        value: round2(observedConditionAt(parcelId, year)),
        capturedAt: iso,
        source: "eo",
      });
    }
    return out;
  }

  async trajectoryStatus(parcelId: string): Promise<TrajectoryFlag> {
    const baseline = this.baseline(parcelId);
    const profile = parcelProfile(parcelId);
    const year = Math.max(0, Math.floor(yearsBetween(baseline, this.now.toISOString())));
    const actual = observedConditionAt(parcelId, year);
    const { status, required, gap } = classify(
      {
        baselineCondition: profile.baselineCondition,
        targetCondition: profile.targetCondition,
        targetYear: profile.byYear,
      },
      year,
      actual,
    );
    return {
      parcelId,
      status,
      year,
      actual: round2(actual),
      required: round2(required),
      gap: round2(gap),
      detectedAt: this.now.toISOString(),
    };
  }
}

/** Convenience: the Defra band an EO estimate currently rounds to. */
export function eoBand(flag: TrajectoryFlag) {
  return scoreToBand(flag.actual);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
