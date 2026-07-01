import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createSurveyTask } from "@/lib/data";

/** POST /api/parcels/dispatch { parcelId, reason? } -> opens a field-survey task. */
export async function POST(req: Request) {
  let body: { parcelId?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.parcelId) {
    return NextResponse.json({ error: "parcelId required" }, { status: 400 });
  }
  try {
    const id = await createSurveyTask(
      getSession(),
      body.parcelId,
      body.reason || "Field verification requested from the portfolio",
    );
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
