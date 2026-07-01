import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { scoreToBand } from "@biocoda/shared";
import { getSession } from "@/lib/auth";
import {
  createSurveyTask,
  getParcel,
  listVerifications,
  openTaskForParcel,
  toContext,
} from "@/lib/data";
import { getConditionSeries, getRequiredCurve, getTrajectory } from "@/lib/eo";
import { TrajectoryChart } from "@/components/TrajectoryChart";
import { ChangeMap } from "@/components/ChangeMap";
import { StatusBadge, ConditionPill } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function ParcelPage({ params }: { params: { id: string } }) {
  const session = getSession();
  const parcel = await getParcel(session, params.id);
  if (!parcel) notFound();
  const ctx = toContext(parcel);

  const [trajectory, requiredCurve, eoSeries, verifications, openTask] = await Promise.all([
    getTrajectory(ctx),
    getRequiredCurve(ctx),
    getConditionSeries(ctx),
    listVerifications(session, parcel.id),
    openTaskForParcel(session, parcel.id),
  ]);

  // Precompute so the server action closes over plain strings, not the whole
  // trajectory/parcel objects (which the RSC boundary would try to serialise).
  const parcelId = parcel.id;
  const surveyReason =
    trajectory.status === "at_risk"
      ? `Earth observation trajectory at risk: ${scoreToBand(trajectory.actual)} vs required ${scoreToBand(
          trajectory.required,
        )} (gap ${trajectory.gap.toFixed(2)})`
      : "Manual field-verification request";

  async function dispatchSurvey() {
    "use server";
    await createSurveyTask(getSession(), parcelId, surveyReason);
    revalidatePath(`/parcels/${parcelId}`);
  }

  const conditionMap = { poor: 1, moderate: 2, good: 3 } as const;

  return (
    <div className="space-y-6">
      <div className="text-sm text-stone-500">
        <Link href="/dashboard" className="text-moss underline">
          Portfolio
        </Link>{" "}
        / {parcel.name}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{parcel.name}</h1>
          <p className="text-sm text-stone-500">
            {parcel.habitatType} · {parcel.areaHa} ha · baseline {parcel.baselineDate} ·{" "}
            <span className="font-mono text-xs">{parcel.metricRef}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={trajectory.status} />
          <form action={dispatchSurvey}>
            <button
              type="submit"
              className="rounded-md bg-moss px-3 py-1.5 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50"
              disabled={!!openTask}
            >
              {openTask ? "Survey dispatched" : "Dispatch field survey"}
            </button>
          </form>
          <a
            href={`/api/reports?parcelId=${parcel.id}&format=pdf`}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-panel"
          >
            Evidence pack (PDF)
          </a>
          <a
            href={`/api/reports?parcelId=${parcel.id}&format=json`}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-muted hover:bg-panel"
          >
            Data (JSON)
          </a>
        </div>
      </div>

      {/* Trajectory */}
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Condition trajectory</h2>
          <span className="text-xs text-stone-500">
            Year {trajectory.year} · actual {trajectory.actual.toFixed(2)} vs required{" "}
            {trajectory.required.toFixed(2)} ({trajectory.gap >= 0 ? "+" : ""}
            {trajectory.gap.toFixed(2)})
          </span>
        </div>
        <TrajectoryChart
          baselineDate={parcel.baselineDate}
          byYear={parcel.byYear}
          currentYear={trajectory.year}
          status={trajectory.status}
          requiredCurve={requiredCurve}
          eoSeries={eoSeries.map((p) => ({ capturedAt: p.capturedAt, value: p.value }))}
          verifications={verifications.map((v) => ({
            at: v.at,
            score: conditionMap[v.condition],
          }))}
        />
      </div>

      {/* Spatial change detection */}
      <ChangeMap parcelId={parcel.id} geom={parcel.geom} baselineDate={parcel.baselineDate} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Metric linkage */}
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Defra Metric linkage</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-stone-500">Metric reference</dt>
            <dd className="font-mono text-xs">{parcel.metricRef}</dd>
            <dt className="text-stone-500">Baseline condition</dt>
            <dd>
              <ConditionPill band={parcel.baselineCondition} />
            </dd>
            <dt className="text-stone-500">Target condition</dt>
            <dd>
              <ConditionPill band={parcel.targetCondition} /> by Year {parcel.byYear}
            </dd>
            <dt className="text-stone-500">Baseline units</dt>
            <dd className="tabular-nums">{parcel.baselineUnits}</dd>
            <dt className="text-stone-500">Target units</dt>
            <dd className="tabular-nums">{parcel.targetUnits}</dd>
          </dl>
          <p className="mt-3 text-xs text-stone-400">
            Units resolved via the Metric adapter (mock). BioCoda links to the Defra Metric; it
            does not recalculate it.
          </p>
        </div>

        {/* Field verifications */}
        <div className="card p-4">
          <h2 className="mb-3 font-semibold">Field verifications</h2>
          {verifications.length === 0 ? (
            <p className="text-sm text-stone-400">
              No field verification yet. {trajectory.status === "at_risk" && "Dispatch a survey to ground-truth the Earth observation signal."}
            </p>
          ) : (
            <ul className="space-y-3">
              {verifications.map((v) => (
                <li key={v.id} className="border-l-2 border-blue-300 pl-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      <ConditionPill band={v.condition} />{" "}
                      <span className="text-stone-500">by {v.ecologist}</span>
                    </span>
                    <span className="text-xs text-stone-400">{v.at.slice(0, 10)}</span>
                  </div>
                  {v.notes && <p className="mt-1 text-xs text-stone-600">{v.notes}</p>}
                  <p className="mt-1 text-xs text-stone-400">
                    {v.photos.length} photo{v.photos.length === 1 ? "" : "s"} · {v.lat.toFixed(4)},{" "}
                    {v.lng.toFixed(4)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
