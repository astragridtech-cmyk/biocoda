import "server-only";
import type { PlanExtraction, Polygon } from "@biocoda/shared";
import { withTenant, type Session } from "./db.js";
import { isDemo, commitPlan as demoCommitPlan } from "./demo.js";
import { synthSquare } from "./plan-geom.js";

const BAND: Record<string, number> = { poor: 1, moderate: 2, good: 3 };
function units(areaHa: number, band: string): number {
  return Math.round(areaHa * (BAND[band] ?? 1) * 2 * 10) / 10;
}

/**
 * Commit the reviewer-approved parcels from a plan extraction. Writes the
 * source plan (for provenance), the parcels, their targets (with clause/quote),
 * and management actions. In demo mode this appends to the in-memory store.
 */
export async function commitPlan(
  session: Session,
  extraction: PlanExtraction,
  approvedRefs: string[],
  /** Optional per-parcel boundaries (keyed by ref). Falls back to a synth square. */
  geometries: Record<string, Polygon> = {},
): Promise<{ planId: string; parcelIds: string[] }> {
  if (isDemo()) return demoCommitPlan(extraction, approvedRefs, geometries);

  const chosen = extraction.parcels.filter((p) => approvedRefs.includes(p.ref));
  const slug =
    extraction.plan.siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    "plan";

  return withTenant(session, async (c) => {
    const planId = `plan-${slug}-${Date.now()}`;
    await c.query(
      `INSERT INTO management_plan (id, tenant_id, title, plan_type, site_name, period_years, extraction)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        planId,
        session.tenantId,
        extraction.plan.title,
        extraction.plan.planType,
        extraction.plan.siteName,
        extraction.plan.periodYears,
        JSON.stringify(extraction),
      ],
    );

    const parcelIds: string[] = [];
    for (let i = 0; i < chosen.length; i++) {
      const p = chosen[i]!;
      const id = `${planId}-${p.ref.toLowerCase()}`;
      const geom = geometries[p.ref] ?? synthSquare(i, p.areaHa);
      await c.query(
        `INSERT INTO parcel (id, tenant_id, name, habitat_type, metric_ref, geom, area_ha, baseline_date)
         VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_GeomFromGeoJSON($6), 4326), $7, CURRENT_DATE)`,
        [id, session.tenantId, p.name, p.habitatType, `BM-${id}`, JSON.stringify(geom), p.areaHa],
      );
      await c.query(
        `INSERT INTO target (id, parcel_id, baseline_condition, target_condition, baseline_units, target_units, by_year, source_plan_id, source_clause, source_quote)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          `target-${id}`,
          id,
          p.baselineCondition,
          p.targetCondition,
          units(p.areaHa, p.baselineCondition),
          p.targetUnits ?? units(p.areaHa, p.targetCondition),
          p.byYear,
          planId,
          p.provenance.clause,
          p.provenance.quote,
        ],
      );
      for (const a of p.managementActions) {
        await c.query(
          `INSERT INTO management_action (parcel_id, plan_id, action, schedule_years, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, planId, a.action, a.scheduleYears, a.notes],
        );
      }
      parcelIds.push(id);
    }
    return { planId, parcelIds };
  });
}
