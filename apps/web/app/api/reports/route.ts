import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildReport } from "@/lib/report";
import { buildReportPdf, type ReportOptions } from "@/lib/report-pdf";
import type { ChangeWindows } from "@/lib/eo-sentinel";

export const dynamic = "force-dynamic";

/** Optional viewport bbox + windows so the PDF matches the on-screen comparison. */
function reportOptions(q: URLSearchParams): ReportOptions {
  const opts: ReportOptions = {};
  const nums = ["w", "s", "e", "n"].map((k) => Number(q.get(k)));
  if (nums.every((v) => Number.isFinite(v))) {
    const [w, s, e, n] = nums as [number, number, number, number];
    if (w < e && s < n) opts.bounds = [w, s, e, n];
  }
  const norm = (v: string | null, end: boolean) =>
    v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T${end ? "23:59:59" : "00:00:00"}Z` : v;
  const bf = norm(q.get("baselineFrom"), false);
  const bt = norm(q.get("baselineTo"), true);
  const rf = norm(q.get("recentFrom"), false);
  const rt = norm(q.get("recentTo"), true);
  if (bf && bt && rf && rt && bf < bt && rf < rt) {
    opts.windows = { baseline: { from: bf, to: bt }, recent: { from: rf, to: rt } } as ChangeWindows;
  }
  return opts;
}

/**
 * GET /api/reports?parcelId=…&format=pdf|json
 *
 * Downloads the annual monitoring pack. `format=pdf` (default) returns the
 * branded evidence pack with timestamped before/after satellite imagery and
 * tamper-evident security features; `format=json` returns the raw manifest.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const parcelId = url.searchParams.get("parcelId");
  const format = url.searchParams.get("format") ?? "pdf";
  if (!parcelId) {
    return NextResponse.json({ error: "parcelId required" }, { status: 400 });
  }
  try {
    if (format === "json") {
      const { manifest } = await buildReport(getSession(), parcelId);
      return new NextResponse(JSON.stringify(manifest, null, 2), {
        headers: {
          "content-type": "application/json",
          "content-disposition": `attachment; filename="monitoring-pack-${parcelId}-Y${manifest.trajectory.year}.json"`,
        },
      });
    }

    const { bytes, filename } = await buildReportPdf(getSession(), parcelId, reportOptions(url.searchParams));
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
