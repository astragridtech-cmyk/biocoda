import { NextResponse } from "next/server";
import { z } from "zod";
import { withTenant } from "@/lib/db";
import { apiSession, DEMO_ECOLOGIST_ID } from "@/lib/api-session";
import * as demo from "@/lib/demo";

const Body = z.object({
  parcelId: z.string(),
  condition: z.enum(["poor", "moderate", "good"]),
  notes: z.string().default(""),
  photos: z.array(z.string()).default([]),
  lng: z.number(),
  lat: z.number(),
  ecologistId: z.string().default(DEMO_ECOLOGIST_ID),
});

/**
 * POST /api/mobile/verifications
 * Records an authoritative field verification and closes any open survey task
 * on the parcel (the EO → field reconciliation step, build doc Phase 3).
 */
export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  try {
    if (demo.isDemo()) {
      const id = demo.addVerification(parsed);
      return NextResponse.json({ id });
    }
    const session = apiSession(req);
    const id = await withTenant(session, async (c) => {
      const { rows } = await c.query(
        `INSERT INTO verification (parcel_id, ecologist_id, condition, notes, photos, geom, at)
         VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), now())
         RETURNING id`,
        [
          parsed.parcelId,
          parsed.ecologistId,
          parsed.condition,
          parsed.notes,
          parsed.photos,
          parsed.lng,
          parsed.lat,
        ],
      );
      const verificationId = rows[0].id as string;
      // Close the open survey task for this parcel, if any.
      await c.query(
        `UPDATE survey_task
         SET status = 'completed', verification_id = $2
         WHERE parcel_id = $1 AND status IN ('open', 'in_progress')`,
        [parsed.parcelId, verificationId],
      );
      return verificationId;
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
