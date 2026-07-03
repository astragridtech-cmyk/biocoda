import { NextResponse } from "next/server";
import { getSession, getAuthState } from "@/lib/auth";
import { portfolioState, digestHtml } from "@/lib/portfolio";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/** POST /api/digest/send -> emails the current state-of-portfolio digest. */
export async function POST(req: Request) {
  let body: { to?: string } = {};
  try {
    body = await req.json();
  } catch {
    // optional override recipient
  }
  try {
    const auth = await getAuthState();
    const to = body.to || auth.email || "ops@biocoda.earth";
    const state = await portfolioState((await getSession()));
    const result = await sendEmail(
      to,
      `BioCoda digest: ${state.atRisk} at risk, ${state.onTrack} on track (Y${state.year})`,
      digestHtml(state),
    );
    return NextResponse.json({ to, ...result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
