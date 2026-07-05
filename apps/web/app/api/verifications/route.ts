import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthState } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { appUserByEmail } from "@/lib/db";
import { hasSupabase } from "@/lib/supabase";
import * as demo from "@/lib/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  parcelId: z.string().min(1),
  condition: z.enum(["poor", "moderate", "good"]),
  notes: z.string().max(2000).default(""),
  // Live device location; optional because a desktop may decline it, in which
  // case we anchor the record to the parcel centroid.
  lng: z.number().optional(),
  lat: z.number().optional(),
});

/**
 * POST /api/verifications
 * Records an authoritative field verification from the web app (any device),
 * attributed to the signed-in ecologist, and closes the open survey task on the
 * parcel. This is the ground-truth that recalibrates the Earth observation
 * trajectory (see @biocoda/shared correctedConditionAt).
 */
export async function POST(req: Request) {
  const auth = await getAuthState();
  if (!auth.authenticated) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (hasSupabase() && !auth.provisioned) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  const session = { tenantId: auth.tenantId, role: auth.role };

  try {
    // Demo (no database): keep the in-memory portfolio behaving the same.
    if (!hasSupabase()) {
      const id = demo.addVerification({
        parcelId: body.parcelId,
        condition: body.condition,
        notes: body.notes,
        photos: [],
        lng: body.lng ?? 0,
        lat: body.lat ?? 0,
        ecologist: auth.name ?? auth.email ?? "Field ecologist",
      });
      return NextResponse.json({ id });
    }

    // Resolve the signed-in user's app_user id to attribute the record.
    const appUser = auth.email ? await appUserByEmail(auth.email) : null;
    if (!appUser) return NextResponse.json({ error: "not provisioned" }, { status: 403 });

    const hasPoint = typeof body.lng === "number" && typeof body.lat === "number";
    const id = await withTenant(session, async (c) => {
      const { rows } = await c.query(
        `INSERT INTO verification (parcel_id, ecologist_id, condition, notes, photos, geom, at)
         VALUES (
           $1, $2, $3, $4, $5,
           COALESCE(
             ${hasPoint ? "ST_SetSRID(ST_MakePoint($6, $7), 4326)" : "NULL"},
             (SELECT ST_PointOnSurface(geom) FROM parcel WHERE id = $1)
           ),
           now()
         )
         RETURNING id`,
        hasPoint
          ? [body.parcelId, appUser.id, body.condition, body.notes, [], body.lng, body.lat]
          : [body.parcelId, appUser.id, body.condition, body.notes, []],
      );
      const verificationId = rows[0].id as string;
      await c.query(
        `UPDATE survey_task SET status = 'completed', verification_id = $2
         WHERE parcel_id = $1 AND status IN ('open', 'in_progress')`,
        [body.parcelId, verificationId],
      );
      return verificationId;
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
