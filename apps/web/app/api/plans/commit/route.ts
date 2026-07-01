import { NextResponse } from "next/server";
import { PlanExtractionSchema, PolygonSchema, type Polygon } from "@biocoda/shared";
import { getSession } from "@/lib/auth";
import { commitPlan } from "@/lib/plan-commit";

export const dynamic = "force-dynamic";

/**
 * POST /api/plans/commit
 * Body: { extraction: PlanExtraction, approvedRefs: string[] }
 * Writes the approved parcels, targets, actions, and the source plan.
 */
export async function POST(req: Request) {
  let body: { extraction?: unknown; approvedRefs?: unknown; geometries?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = PlanExtractionSchema.safeParse(body.extraction);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid extraction: " + parsed.error.message }, { status: 400 });
  }
  const approvedRefs = Array.isArray(body.approvedRefs)
    ? (body.approvedRefs as string[])
    : parsed.data.parcels.map((p) => p.ref);

  if (approvedRefs.length === 0) {
    return NextResponse.json({ error: "no parcels approved" }, { status: 400 });
  }

  // Optional per-parcel boundaries, keyed by parcel ref. Validate each polygon.
  const geometries: Record<string, Polygon> = {};
  if (body.geometries && typeof body.geometries === "object") {
    for (const [ref, g] of Object.entries(body.geometries as Record<string, unknown>)) {
      const res = PolygonSchema.safeParse(g);
      if (res.success) geometries[ref] = res.data;
    }
  }

  try {
    const result = await commitPlan(getSession(), parsed.data, approvedRefs, geometries);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
