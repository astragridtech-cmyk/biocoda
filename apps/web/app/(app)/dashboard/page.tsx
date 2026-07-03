import { getSession } from "@/lib/auth";
import { listParcels } from "@/lib/data";
import { PortfolioApp, type PortfolioParcel } from "@/components/PortfolioApp";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = (await getSession());

  let parcels;
  try {
    parcels = await listParcels(session);
  } catch (err) {
    return <DbDown message={(err as Error).message} />;
  }

  const lean: PortfolioParcel[] = parcels.map((p) => ({
    id: p.id,
    name: p.name,
    habitatType: p.habitatType,
    areaHa: p.areaHa,
    baselineDate: p.baselineDate,
    geom: p.geom,
  }));

  return <PortfolioApp parcels={lean} role={session.role} />;
}

function DbDown({ message }: { message: string }) {
  return (
    <div className="card p-8 text-center">
      <h1 className="text-lg font-semibold">Database not reachable</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Start the stack with <code className="rounded bg-panel px-1">docker compose up</code>, or
        run the zero-infra demo with <code className="rounded bg-panel px-1">BIOCODA_DEMO=1</code>.
        Underlying error:
      </p>
      <pre className="mx-auto mt-3 max-w-md overflow-x-auto rounded bg-panel p-2 text-left text-xs">
        {message}
      </pre>
    </div>
  );
}
