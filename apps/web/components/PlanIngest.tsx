"use client";

import { useState } from "react";
import Link from "next/link";
import type { ConditionBand, PlanExtraction, Polygon } from "@biocoda/shared";
import { parseKmlPolygons, polygonAreaHa } from "@biocoda/shared";
import { ConditionPill } from "./StatusBadge";

type Step = "source" | "review" | "done";
const BANDS: ConditionBand[] = ["poor", "moderate", "good"];
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Chunked base64 for binary files (avoids call-stack overflow on big buffers). */
function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

export function PlanIngest() {
  const [step, setStep] = useState<Step>("source");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<"mock" | "anthropic">("mock");
  const [extraction, setExtraction] = useState<PlanExtraction | null>(null);
  const [include, setInclude] = useState<Record<string, boolean>>({});
  const [pasted, setPasted] = useState("");
  const [geometries, setGeometries] = useState<Record<string, Polygon>>({});
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [committed, setCommitted] = useState<{ count: number } | null>(null);

  async function runExtract(payload: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/plans/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "extraction failed");
      const ex = data.extraction as PlanExtraction;
      setExtraction(ex);
      setEngine(data.engine);
      setInclude(Object.fromEntries(ex.parcels.map((p) => [p.ref, true])));
      setStep("review");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File) {
    const name = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    const isDocx = file.type.includes("wordprocessingml") || name.endsWith(".docx");
    if (isPdf || isDocx) {
      const base64 = toBase64(await file.arrayBuffer());
      await runExtract({ filename: file.name, mediaType: isPdf ? "application/pdf" : DOCX, base64 });
    } else {
      await runExtract({ filename: file.name, mediaType: "text/plain", text: await file.text() });
    }
  }

  /** Build a fresh extraction from a KML Area of Interest, one parcel per placemark. */
  async function onKml(file: File) {
    setBusy(true);
    setError(null);
    try {
      const placemarks = parseKmlPolygons(await file.text());
      if (!placemarks.length) throw new Error("No polygon boundaries were found in that KML file.");
      const today = new Date().toISOString().slice(0, 10);
      const geoms: Record<string, Polygon> = {};
      const parcels = placemarks.map((pm, i) => {
        const ref = `AOI-${i + 1}`;
        geoms[ref] = pm.polygon;
        return {
          ref,
          name: pm.name || `Area of interest ${i + 1}`,
          habitatType: "Area of interest (KML)",
          areaHa: Math.max(0.01, polygonAreaHa(pm.polygon)),
          baselineCondition: "moderate" as ConditionBand,
          targetCondition: "good" as ConditionBand,
          byYear: 30,
          targetUnits: null,
          managementActions: [],
          monitoring: null,
          provenance: { page: null, clause: "KML upload", quote: `Boundary imported from ${file.name}` },
        };
      });
      const ex: PlanExtraction = {
        plan: {
          planType: "other",
          title: `AOI import: ${file.name}`,
          siteName: placemarks[0]?.name || "Uploaded AOI",
          author: "Self-serve upload",
          periodYears: 30,
          preparedDate: today,
        },
        parcels,
        confidence: 1,
        warnings: [
          "Baseline and target conditions defaulted to moderate then good; adjust before committing.",
          "These real boundaries drive Sentinel-2 EO when BIOCODA_EO_REAL is enabled.",
        ],
      };
      setExtraction(ex);
      setEngine("mock");
      setInclude(Object.fromEntries(parcels.map((p) => [p.ref, true])));
      setGeometries(geoms);
      setGeoStatus(`${placemarks.length} AOI ${placemarks.length === 1 ? "boundary" : "boundaries"} loaded from KML`);
      setStep("review");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /** Attach real boundaries (GeoJSON or KML) to extracted parcels, matched by ref/name. */
  async function onBoundary(file: File) {
    setGeoStatus(null);
    const lower = file.name.toLowerCase();
    try {
      const text = await file.text();
      const found: { key: string; geom: Polygon }[] = [];
      if (lower.endsWith(".kml") || text.includes("<kml") || text.includes("<Placemark")) {
        for (const pm of parseKmlPolygons(text)) {
          found.push({ key: (pm.name ?? "").trim().toLowerCase(), geom: pm.polygon });
        }
      } else {
        const fc = JSON.parse(text);
        const features =
          fc?.type === "FeatureCollection" ? fc.features : fc?.type === "Feature" ? [fc] : [];
        for (const f of features) {
          const props = f?.properties ?? {};
          const key = String(props.ref ?? props.id ?? props.parcel ?? props.name ?? "").trim().toLowerCase();
          let geom = f?.geometry;
          if (geom?.type === "MultiPolygon") geom = { type: "Polygon", coordinates: geom.coordinates[0] };
          if (geom?.type !== "Polygon") continue;
          found.push({ key, geom: geom as Polygon });
        }
      }
      const map: Record<string, Polygon> = {};
      for (const { key, geom } of found) {
        if (!key) continue;
        const parcel = extraction?.parcels.find(
          (p) => p.ref.toLowerCase() === key || p.name.toLowerCase() === key,
        );
        if (parcel) map[parcel.ref] = geom;
      }
      setGeometries(map);
      const total = extraction?.parcels.length ?? 0;
      setGeoStatus(`${Object.keys(map).length} of ${total} parcels matched to a boundary`);
    } catch {
      setGeoStatus("Could not parse that boundary file.");
    }
  }

  function editParcel(ref: string, patch: Partial<PlanExtraction["parcels"][number]>) {
    setExtraction((ex) =>
      ex ? { ...ex, parcels: ex.parcels.map((p) => (p.ref === ref ? { ...p, ...patch } : p)) } : ex,
    );
  }

  async function commit() {
    if (!extraction) return;
    setBusy(true);
    setError(null);
    try {
      const approvedRefs = extraction.parcels.filter((p) => include[p.ref]).map((p) => p.ref);
      const res = await fetch("/api/plans/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ extraction, approvedRefs, geometries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "commit failed");
      setCommitted({ count: data.parcelIds.length });
      setStep("done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (step === "done" && committed) {
    return (
      <div className="card p-8 text-center">
        <div className="text-2xl font-semibold text-forest">Plan committed</div>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {committed.count} parcel{committed.count === 1 ? "" : "s"} were added to the portfolio as
          Awaiting EO, with their targets and the source clauses retained for the evidence trail.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/dashboard" className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-leaf">
            View portfolio
          </Link>
          <button
            onClick={() => {
              setStep("source");
              setExtraction(null);
              setCommitted(null);
              setPasted("");
            }}
            className="rounded-md border border-line px-4 py-2 text-sm hover:bg-panel"
          >
            Import another plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Import a management plan</h1>
        <p className="text-sm text-muted">
          Extract parcels, conditions, targets, and management actions from an HMMP, LEMP, or
          Biodiversity Gain Plan. You review and approve before anything is written.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-orchid/40 bg-[#F1EAF7] px-4 py-2 text-sm text-orchid">
          {error}
        </div>
      )}

      {step === "source" && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <div className="text-sm font-semibold text-ink">Try the sample</div>
            <p className="mt-1 text-xs text-muted">A short Willowmere HMMP with five parcels.</p>
            <button
              disabled={busy}
              onClick={() => runExtract({ useSample: true })}
              className="mt-3 rounded-md bg-moss px-3 py-1.5 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50"
            >
              {busy ? "Extracting…" : "Extract sample plan"}
            </button>
          </div>

          <div className="card p-5">
            <div className="text-sm font-semibold text-ink">Upload a plan</div>
            <p className="mt-1 text-xs text-muted">PDF, Word (.docx), or plain text.</p>
            <input
              type="file"
              accept="application/pdf,text/plain,.txt,.pdf,.docx"
              disabled={busy}
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              className="mt-3 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-field file:px-3 file:py-1.5 file:text-forest"
            />
          </div>

          <div className="card p-5">
            <div className="text-sm font-semibold text-ink">Paste text</div>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="Paste plan text…"
              className="mt-2 h-20 w-full rounded-md border border-line p-2 text-xs"
            />
            <button
              disabled={busy || pasted.trim().length < 20}
              onClick={() => runExtract({ filename: "pasted.txt", mediaType: "text/plain", text: pasted })}
              className="mt-2 rounded-md border border-line px-3 py-1.5 text-sm hover:bg-panel disabled:opacity-50"
            >
              Extract
            </button>
          </div>
        </div>
      )}

      {step === "source" && (
        <div className="card border-forest/30 bg-[#F3F7EF] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="rounded-full bg-field px-2 py-0.5 text-[11px] text-forest">New</span>
                Upload an Area of Interest (.kml)
              </div>
              <p className="mt-1 max-w-xl text-xs text-muted">
                Drop a KML from Google Earth or QGIS to create parcels straight from their real
                boundaries. Each placemark becomes a parcel you can review and commit, and those
                boundaries are what the live Sentinel-2 EO reads.
              </p>
            </div>
            <label className="shrink-0 cursor-pointer rounded-md bg-moss px-3 py-1.5 text-sm font-medium text-white hover:bg-leaf">
              {busy ? "Reading…" : "Choose KML file"}
              <input
                type="file"
                accept=".kml,application/vnd.google-earth.kml+xml,application/xml,text/xml"
                disabled={busy}
                onChange={(e) => e.target.files?.[0] && onKml(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {step === "review" && extraction && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-ink">{extraction.plan.title}</div>
                <div className="text-xs text-muted">
                  {extraction.plan.planType} · {extraction.plan.siteName} · {extraction.plan.periodYears}-year plan
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-field px-2 py-0.5 text-forest">
                  {engine === "anthropic" ? "Claude Opus 4.8" : "sample engine"}
                </span>
                <span className="text-muted">confidence {(extraction.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
            {extraction.warnings.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">
                {extraction.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-xs">
              <span className="font-medium text-ink">Boundaries (optional)</span>
              <input
                type="file"
                accept=".geojson,.json,.kml,application/geo+json,application/json,application/vnd.google-earth.kml+xml"
                onChange={(e) => e.target.files?.[0] && onBoundary(e.target.files[0])}
                className="text-muted file:mr-2 file:rounded file:border-0 file:bg-field file:px-2 file:py-1 file:text-forest"
              />
              <span className="text-muted">
                {geoStatus ?? "Attach a GeoJSON or KML to place parcels on their real boundaries (else a placeholder is used)."}
              </span>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-panel text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Include</th>
                  <th className="px-3 py-2">Parcel</th>
                  <th className="px-3 py-2">Habitat</th>
                  <th className="px-3 py-2">Baseline → target</th>
                  <th className="px-3 py-2">By year</th>
                  <th className="px-3 py-2">Area</th>
                  <th className="px-3 py-2">Boundary</th>
                  <th className="px-3 py-2">From the plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {extraction.parcels.map((p) => (
                  <tr key={p.ref} className={include[p.ref] ? "" : "opacity-50"}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={include[p.ref] ?? true}
                        onChange={(e) => setInclude((m) => ({ ...m, [p.ref]: e.target.checked }))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-ink">{p.name}</div>
                      <div className="text-xs text-muted">{p.ref}</div>
                    </td>
                    <td className="px-3 py-2 text-muted">{p.habitatType}</td>
                    <td className="px-3 py-2">
                      <ConditionPill band={p.baselineCondition} />{" → "}
                      <select
                        value={p.targetCondition}
                        onChange={(e) => editParcel(p.ref, { targetCondition: e.target.value as ConditionBand })}
                        className="rounded border border-line bg-white px-1 py-0.5 text-xs capitalize"
                      >
                        {BANDS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={p.byYear}
                        onChange={(e) => editParcel(p.ref, { byYear: Number(e.target.value) })}
                        className="w-14 rounded border border-line px-1 py-0.5 text-xs tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2 tabular-nums text-muted">{p.areaHa} ha</td>
                    <td className="px-3 py-2 text-xs">
                      {geometries[p.ref] ? (
                        <span className="rounded bg-[#E4EBDE] px-1.5 py-0.5 text-forest">mapped</span>
                      ) : (
                        <span className="text-muted">placeholder</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">
                      <span className="font-mono">{p.provenance.clause}</span>{" "}
                      <span className="italic">“{p.provenance.quote}”</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("source")}
              className="text-sm text-muted underline"
            >
              Back
            </button>
            <button
              disabled={busy || Object.values(include).every((v) => !v)}
              onClick={commit}
              className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50"
            >
              {busy
                ? "Committing…"
                : `Commit ${extraction.parcels.filter((p) => include[p.ref]).length} approved`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
