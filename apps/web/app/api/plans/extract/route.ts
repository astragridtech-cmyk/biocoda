import { NextResponse } from "next/server";
import { SAMPLE_PLAN_TEXT } from "@biocoda/adapters";
import { extractPlan } from "@/lib/plan-extract";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/plans/extract
 * Body: { useSample } | { filename, mediaType, text } | { filename, mediaType, base64 }
 * Returns the proposed PlanExtraction for review (nothing is written yet).
 */
export async function POST(req: Request) {
  let body: {
    useSample?: boolean;
    filename?: string;
    mediaType?: string;
    text?: string;
    base64?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  let input = body.useSample
    ? { filename: "Willowmere HMMP (sample)", mediaType: "text/plain", text: SAMPLE_PLAN_TEXT }
    : {
        filename: body.filename ?? "plan",
        mediaType: body.mediaType ?? "text/plain",
        text: body.text,
        base64: body.base64,
      };

  if (!body.useSample && !input.text && !input.base64) {
    return NextResponse.json({ error: "provide text, a file, or useSample" }, { status: 400 });
  }

  try {
    // .docx is not a Claude document type; convert to text server-side first.
    if (input.base64 && input.mediaType.includes("wordprocessingml")) {
      const { docxToText } = await import("@/lib/docx");
      input = { filename: input.filename, mediaType: "text/plain", text: await docxToText(input.base64) };
    }
    const { extraction, engine } = await extractPlan(input);
    return NextResponse.json({ extraction, engine });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
