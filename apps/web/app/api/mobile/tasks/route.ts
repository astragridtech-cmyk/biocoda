import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api-session";
import { listSurveyTasks } from "@/lib/data";

/** GET /api/mobile/tasks → the ecologist's targeted survey worklist (open). */
export async function GET(req: Request) {
  try {
    const tasks = await listSurveyTasks(apiSession(req), "open");
    return NextResponse.json({ tasks });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
