import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api-session";
import { getParcel, toContext } from "@/lib/data";
import { getTrajectory } from "@/lib/eo";

/** GET /api/mobile/parcels/:id → parcel facts + latest EO verdict for the app. */
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = apiSession(req);
    const parcel = await getParcel(session, params.id);
    if (!parcel) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const trajectory = await getTrajectory(toContext(parcel));
    return NextResponse.json({
      parcel: {
        id: parcel.id,
        name: parcel.name,
        habitatType: parcel.habitatType,
        areaHa: parcel.areaHa,
        baselineCondition: parcel.baselineCondition,
        targetCondition: parcel.targetCondition,
        byYear: parcel.byYear,
        centroid: centroid(parcel.geom),
      },
      trajectory,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

function centroid(geom: { coordinates: number[][][] }): [number, number] {
  const ring = geom.coordinates[0]!;
  let x = 0;
  let y = 0;
  const pts = ring.slice(0, -1);
  for (const [lng, lat] of pts) {
    x += lng!;
    y += lat!;
  }
  return [x / pts.length, y / pts.length];
}
