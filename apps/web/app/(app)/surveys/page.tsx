import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listSurveyTasks } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const session = await getSession();
  const tasks = (await listSurveyTasks(session)).filter(
    (t) => t.status === "open" || t.status === "in_progress",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Survey queue</h1>
        <p className="text-sm text-stone-500">
          Parcels awaiting a field visit. Open one to record the condition you assess on site; your
          verification becomes the authoritative status and recalibrates the trajectory.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          No open surveys. Parcels flagged at-risk and dispatched for verification appear here.
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {tasks.map((t) => (
            <Link
              key={t.id}
              href={`/parcels/${t.parcelId}#verify`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-panel"
            >
              <div>
                <div className="font-medium text-ink">{t.parcelName}</div>
                <div className="text-xs text-muted">
                  {t.habitatType} · {t.reason}
                </div>
              </div>
              <span className="shrink-0 rounded-md bg-moss px-3 py-1.5 text-xs font-medium text-white">
                Record verification
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
