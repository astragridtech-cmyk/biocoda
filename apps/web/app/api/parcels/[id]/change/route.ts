import { NextResponse } from "next/server";
import { getSession, getAuthState } from "@/lib/auth";
import { getParcel } from "@/lib/data";
import { hasSentinelCreds, sentinelComparison, type ChangeWindows } from "@/lib/eo-sentinel";

export const dynamic = "force-dynamic";

/** Accept YYYY-MM-DD (or full ISO) and normalise to an ISO timestamp. */
function normalise(value: string | null, endOfDay: boolean): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  if (value.length === 10) return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}Z`;
  return value;
}

/** Optional viewport bbox from w/s/e/n query params (the current zoom/pan view). */
function parseBounds(q: URLSearchParams): [number, number, number, number] | undefined {
  const nums = ["w", "s", "e", "n"].map((k) => Number(q.get(k)));
  if (nums.some((v) => !Number.isFinite(v))) return undefined;
  const [w, s, e, n] = nums as [number, number, number, number];
  if (w >= e || s >= n) return undefined;
  return [w, s, e, n];
}

/**
 * GET /api/parcels/:id/change
 *
 * Before/after comparison for a parcel: Copernicus Sentinel-2 true-colour
 * imagery for the baseline and comparison periods plus the NDVI-change raster,
 * for the side-by-side viewer. The before/after windows come from the query string when provided
 * (baselineFrom/baselineTo/recentFrom/recentTo, each YYYY-MM-DD); otherwise the
 * default growing seasons are used. Available whenever the CDSE credentials are
 * set; returns { available:false } otherwise so the UI can explain how to enable it.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!(await getAuthState()).authenticated) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasSentinelCreds()) {
    return NextResponse.json({ available: false });
  }

  const q = new URL(req.url).searchParams;
  const bf = normalise(q.get("baselineFrom"), false);
  const bt = normalise(q.get("baselineTo"), true);
  const rf = normalise(q.get("recentFrom"), false);
  const rt = normalise(q.get("recentTo"), true);
  let windows: ChangeWindows | undefined;
  if (bf && bt && rf && rt) {
    if (bf >= bt || rf >= rt) {
      return NextResponse.json({ error: "each window's start must be before its end" }, { status: 400 });
    }
    windows = { baseline: { from: bf, to: bt }, recent: { from: rf, to: rt } };
  }

  const bounds = parseBounds(q);

  try {
    const parcel = await getParcel(getSession(), params.id);
    if (!parcel) return NextResponse.json({ error: "not found" }, { status: 404 });
    const comparison = await sentinelComparison(parcel.geom, parcel.baselineDate, windows, bounds);
    return NextResponse.json({ available: true, ...comparison });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
