import "server-only";
import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage } from "pdf-lib";
import { createHash, randomUUID } from "node:crypto";
import { buildReport } from "./report.js";
import { getParcel } from "./data.js";
import {
  hasSentinelCreds,
  sentinelComparison,
  type ChangeComparison,
  type ChangeWindows,
} from "./eo-sentinel.js";
import type { Session } from "./db.js";

export interface ReportOptions {
  /** The comparison viewport (zoom/pan) so the report matches what the user saw. */
  bounds?: [number, number, number, number];
  /** Baseline/comparison windows to render, if not the defaults. */
  windows?: ChangeWindows;
}

/**
 * Annual monitoring pack as a PDF: BioCoda branding, the numerical metrics, and
 * timestamped before/after Sentinel-2 imagery of the AOI, with tamper-evident
 * security features (integrity hash, document ID, watermark, PDF metadata).
 */

const FOREST = rgb(0.231, 0.49, 0.235);
const ORCHID = rgb(0.557, 0.357, 0.71);
const INK = rgb(0.094, 0.188, 0.102);
const MUTED = rgb(0.369, 0.353, 0.314);
const LINE = rgb(0.863, 0.898, 0.843);
const A4: [number, number] = [595.28, 841.89];
const M = 42; // margin

function band(b: string): string {
  return b.charAt(0).toUpperCase() + b.slice(1);
}

function windowLabel(from: string, to: string): string {
  const f = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${f(from)} to ${f(to)}`;
}

/** The trajectory-coda mark (baseline dot, rising line, violet coda point) + wordmark. */
function drawLogo(page: PDFPage, bold: PDFFont, x: number, y: number) {
  page.drawLine({ start: { x, y }, end: { x: x + 22, y: y + 13 }, thickness: 2.2, color: FOREST });
  page.drawCircle({ x, y, size: 2.6, color: FOREST });
  page.drawCircle({ x: x + 22, y: y + 13, size: 2.8, color: ORCHID });
  page.drawText("Bio", { x: x + 32, y: y - 2, size: 18, font: bold, color: FOREST });
  const bioW = bold.widthOfTextAtSize("Bio", 18);
  page.drawText("Coda", { x: x + 32 + bioW, y: y - 2, size: 18, font: bold, color: ORCHID });
}

/** Diagonal security watermark, repeated down the page. */
function drawWatermark(page: PDFPage, bold: PDFFont) {
  for (let i = 0; i < 4; i++) {
    page.drawText("BioCoda  Verified Evidence", {
      x: 30, y: 120 + i * 200, size: 34, font: bold,
      color: rgb(0.55, 0.6, 0.5), opacity: 0.06, rotate: degrees(32),
    });
  }
}

/** Tamper-evident footer: document ID, timestamp, integrity hash. */
function drawFooter(page: PDFPage, font: PDFFont, bold: PDFFont, docId: string, integrity: string, generatedAt: Date) {
  const pw = A4[0];
  const fy = M + 34;
  page.drawLine({ start: { x: M, y: fy + 6 }, end: { x: pw - M, y: fy + 6 }, thickness: 1, color: LINE });
  page.drawText(`Document ID: ${docId}`, { x: M, y: fy - 4, size: 7.5, font, color: MUTED });
  const gen = `Generated: ${generatedAt.toISOString()} by BioCoda`;
  page.drawText(gen, { x: pw - M - font.widthOfTextAtSize(gen, 7.5), y: fy - 4, size: 7.5, font, color: MUTED });
  page.drawText(`Integrity (SHA-256): ${integrity}`, { x: M, y: fy - 15, size: 7.5, font: bold, color: INK });
  page.drawText(
    "Tamper-evident: altering any value or image invalidates this hash. Earth observation is decision support; field verification is authoritative.",
    { x: M, y: fy - 25, size: 7, font, color: MUTED },
  );
}

export async function buildReportPdf(
  session: Session,
  parcelId: string,
  opts: ReportOptions = {},
): Promise<{ bytes: Uint8Array; filename: string }> {
  const { manifest } = await buildReport(session, parcelId);
  const parcel = await getParcel(session, parcelId);

  let comparison: ChangeComparison | null = null;
  if (parcel && hasSentinelCreds()) {
    try {
      comparison = await sentinelComparison(parcel.geom, parcel.baselineDate, opts.windows, opts.bounds);
    } catch {
      comparison = null; // imagery is best-effort; the metrics pack still stands.
    }
  }

  const generatedAt = new Date();
  const docId = randomUUID();
  const integrity = createHash("sha256")
    .update(JSON.stringify(manifest) + (comparison?.diff ?? ""))
    .digest("hex");

  const pdf = await PDFDocument.create();
  pdf.setTitle(`BioCoda Evidence Pack: ${manifest.parcel.name}`);
  pdf.setAuthor("BioCoda");
  pdf.setSubject("Biodiversity Net Gain habitat monitoring evidence pack");
  pdf.setProducer("BioCoda Evidence Engine");
  pdf.setCreator("BioCoda");
  pdf.setKeywords([`sha256:${integrity}`, `docid:${docId}`, `parcel:${parcelId}`]);
  pdf.setCreationDate(generatedAt);
  pdf.setModificationDate(generatedAt);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage(A4);
  const [pw, ph] = A4;
  const contentW = pw - 2 * M;

  drawWatermark(page, bold);

  // ── Header ──
  let y = ph - M - 6;
  drawLogo(page, bold, M, y);
  page.drawText("Habitat Monitoring Evidence Pack", {
    x: pw - M - bold.widthOfTextAtSize("Habitat Monitoring Evidence Pack", 11),
    y: y + 2,
    size: 11,
    font: bold,
    color: INK,
  });
  y -= 26;
  page.drawText(manifest.parcel.name, { x: M, y, size: 20, font: bold, color: INK });
  y -= 16;
  page.drawText(
    `${manifest.parcel.habitatType}  ·  ${manifest.parcel.areaHa} ha  ·  ${manifest.parcel.metricRef}  ·  management year ${manifest.trajectory.year}`,
    { x: M, y, size: 9.5, font, color: MUTED },
  );
  y -= 14;
  page.drawLine({ start: { x: M, y }, end: { x: pw - M, y }, thickness: 1, color: LINE });
  y -= 20;

  // ── Metrics ──
  page.drawText("Condition metrics", { x: M, y, size: 11, font: bold, color: INK });
  y -= 16;
  const statusLabel = manifest.trajectory.status === "at_risk" ? "At risk" : "On track";
  const rows: [string, string][] = [
    ["Baseline condition", `${band(manifest.target.baselineCondition)} (captured ${manifest.parcel.baselineDate})`],
    ["Target condition", `${band(manifest.target.targetCondition)} by year ${manifest.target.byYear}`],
    ["Earth observation condition (now)", manifest.trajectory.actual.toFixed(2)],
    ["Required condition (now)", manifest.trajectory.required.toFixed(2)],
    ["Gap to trajectory", `${manifest.trajectory.gap >= 0 ? "+" : ""}${manifest.trajectory.gap.toFixed(2)}`],
    ["Trajectory status", statusLabel],
    ["Metric baseline units", String(manifest.metric.baselineUnits ?? "-")],
    ["Metric target units", String(manifest.metric.targetUnits ?? "-")],
    ["Field verifications on record", String(manifest.verifications.length)],
  ];
  const colW = contentW / 2;
  const half = Math.ceil(rows.length / 2);
  const rowH = 26;
  rows.forEach(([k, v], i) => {
    const col = i < half ? 0 : 1;
    const row = i < half ? i : i - half;
    const rx = M + col * colW;
    const ry = y - row * rowH;
    page.drawText(k, { x: rx, y: ry, size: 8.5, font, color: MUTED });
    page.drawText(v, { x: rx, y: ry - 12, size: 10, font: bold, color: INK });
  });
  y -= half * rowH + 12;
  page.drawLine({ start: { x: M, y }, end: { x: pw - M, y }, thickness: 1, color: LINE });
  y -= 20;

  // ── Timestamped satellite imagery ──
  page.drawText("Satellite imagery of the area of interest", { x: M, y, size: 11, font: bold, color: INK });
  y -= 6;

  const gap = 14;
  const imgW = (contentW - gap) / 2;
  const imgH = imgW * 0.72;

  async function drawFrame(dataUrl: string | undefined, x: number, top: number, w: number, h: number, badge: string, caption: string) {
    page.drawRectangle({ x, y: top - h, width: w, height: h, color: rgb(0.93, 0.95, 0.91), borderColor: LINE, borderWidth: 1 });
    if (dataUrl) {
      const png = await pdf.embedPng(Buffer.from(dataUrl.split(",")[1]!, "base64"));
      page.drawImage(png, { x, y: top - h, width: w, height: h });
    } else {
      page.drawText("imagery unavailable", { x: x + 8, y: top - h / 2, size: 8, font, color: MUTED });
    }
    page.drawRectangle({ x: x + 6, y: top - 15, width: bold.widthOfTextAtSize(badge, 7) + 8, height: 11, color: rgb(0, 0, 0), opacity: 0.55 });
    page.drawText(badge, { x: x + 10, y: top - 13, size: 7, font: bold, color: rgb(1, 1, 1) });
    page.drawText(caption, { x, y: top - h - 11, size: 7.5, font, color: MUTED });
  }

  const rowTop = y - 8;
  await drawFrame(
    comparison?.baseline.png,
    M,
    rowTop,
    imgW,
    imgH,
    "BEFORE",
    comparison ? `Baseline: ${windowLabel(comparison.baseline.from, comparison.baseline.to)}` : "Baseline imagery unavailable",
  );
  await drawFrame(
    comparison?.recent.png,
    M + imgW + gap,
    rowTop,
    imgW,
    imgH,
    "AFTER",
    comparison ? `Comparison: ${windowLabel(comparison.recent.from, comparison.recent.to)}` : "Comparison imagery unavailable",
  );
  y = rowTop - imgH - 24;

  // Detected-change frame (comparison image + NDVI difference overlay).
  const chW = imgW;
  const chH = chW * 0.72;
  const chTop = y;
  page.drawRectangle({ x: M, y: chTop - chH, width: chW, height: chH, color: rgb(0.93, 0.95, 0.91), borderColor: LINE, borderWidth: 1 });
  if (comparison) {
    const base = await pdf.embedPng(Buffer.from(comparison.recent.png.split(",")[1]!, "base64"));
    page.drawImage(base, { x: M, y: chTop - chH, width: chW, height: chH });
    const diff = await pdf.embedPng(Buffer.from(comparison.diff.split(",")[1]!, "base64"));
    page.drawImage(diff, { x: M, y: chTop - chH, width: chW, height: chH });
  }
  page.drawRectangle({ x: M + 6, y: chTop - 15, width: bold.widthOfTextAtSize("CHANGE", 7) + 8, height: 11, color: rgb(0, 0, 0), opacity: 0.55 });
  page.drawText("CHANGE", { x: M + 10, y: chTop - 13, size: 7, font: bold, color: rgb(1, 1, 1) });
  // Change legend
  const lx = M + chW + gap;
  page.drawText("Detected change (NDVI difference)", { x: lx, y: chTop - 12, size: 9, font: bold, color: INK });
  page.drawRectangle({ x: lx, y: chTop - 30, width: 9, height: 9, color: rgb(0.85, 0.23, 0.18) });
  page.drawText("Vegetation loss", { x: lx + 14, y: chTop - 29, size: 8.5, font, color: MUTED });
  page.drawRectangle({ x: lx, y: chTop - 44, width: 9, height: 9, color: rgb(0.22, 0.6, 0.28) });
  page.drawText("Vegetation gain", { x: lx + 14, y: chTop - 43, size: 8.5, font, color: MUTED });
  page.drawText("Transparent where stable.", { x: lx, y: chTop - 58, size: 8, font, color: MUTED });
  page.drawText("Sentinel-2 (Copernicus), least-cloud", { x: lx, y: chTop - 72, size: 8, font, color: MUTED });
  page.drawText("composite per period.", { x: lx, y: chTop - 82, size: 8, font, color: MUTED });

  drawFooter(page, font, bold, docId, integrity, generatedAt);

  // ── Page 2: management interventions and progress ──
  const p2 = pdf.addPage(A4);
  drawWatermark(p2, bold);
  let y2 = ph - M - 6;
  drawLogo(p2, bold, M, y2);
  const p2title = "Management interventions and progress";
  p2.drawText(p2title, { x: pw - M - bold.widthOfTextAtSize(p2title, 11), y: y2 + 2, size: 11, font: bold, color: INK });
  y2 -= 26;
  p2.drawText(manifest.parcel.name, { x: M, y: y2, size: 18, font: bold, color: INK });
  y2 -= 15;
  p2.drawText(
    `${manifest.parcel.habitatType}  ·  ${band(manifest.target.baselineCondition)} to ${band(manifest.target.targetCondition)} by year ${manifest.target.byYear}`,
    { x: M, y: y2, size: 9.5, font, color: MUTED },
  );
  y2 -= 14;
  p2.drawLine({ start: { x: M, y: y2 }, end: { x: pw - M, y: y2 }, thickness: 1, color: LINE });
  y2 -= 22;

  // Progress toward target condition
  const prog = manifest.progress;
  p2.drawText("Progress toward target condition", { x: M, y: y2, size: 11, font: bold, color: INK });
  y2 -= 20;
  const barY = y2 - 4;
  p2.drawRectangle({ x: M, y: barY, width: contentW, height: 13, color: rgb(0.9, 0.93, 0.87) });
  p2.drawRectangle({ x: M, y: barY, width: Math.max(2, (contentW * prog.conditionFromBaselinePct) / 100), height: 13, color: prog.onTrack ? FOREST : ORCHID });
  p2.drawText(`${prog.conditionFromBaselinePct}%`, { x: M + 6, y: barY + 3, size: 8, font: bold, color: rgb(1, 1, 1) });
  y2 = barY - 12;
  p2.drawText(
    `${prog.conditionFromBaselinePct}% of the way from baseline (${band(manifest.target.baselineCondition)}) to target (${band(manifest.target.targetCondition)}).`,
    { x: M, y: y2, size: 8.5, font, color: MUTED },
  );
  y2 -= 22;
  const pm: [string, string, boolean][] = [
    ["Current condition score", `${prog.currentScore.toFixed(2)} / ${prog.targetScore.toFixed(1)}`, true],
    ["Management year", `${prog.yearsElapsed} of ${prog.targetYear}`, true],
    ["Years to target", String(prog.yearsToTarget), true],
    ["Trajectory", prog.onTrack ? "On track" : "At risk", prog.onTrack],
  ];
  const pmW = contentW / pm.length;
  pm.forEach(([k, v, ok], i) => {
    const rx = M + i * pmW;
    p2.drawText(k, { x: rx, y: y2, size: 8, font, color: MUTED });
    p2.drawText(v, { x: rx, y: y2 - 13, size: 12, font: bold, color: ok ? INK : ORCHID });
  });
  y2 -= 34;
  p2.drawLine({ start: { x: M, y: y2 }, end: { x: pw - M, y: y2 }, thickness: 1, color: LINE });
  y2 -= 22;

  // Management interventions table
  p2.drawText("Management interventions", { x: M, y: y2, size: 11, font: bold, color: INK });
  y2 -= 22;
  const statusX = pw - M - 130;
  p2.drawText("INTERVENTION", { x: M, y: y2, size: 7.5, font: bold, color: MUTED });
  p2.drawText("STATUS", { x: statusX, y: y2, size: 7.5, font: bold, color: MUTED });
  y2 -= 7;
  p2.drawLine({ start: { x: M, y: y2 }, end: { x: pw - M, y: y2 }, thickness: 0.7, color: LINE });
  y2 -= 17;
  for (const it of manifest.interventions) {
    const done = it.status === "Complete" || it.status === "Established";
    const col = done ? FOREST : it.status === "Scheduled" ? MUTED : ORCHID;
    p2.drawText(it.action, { x: M, y: y2, size: 10.5, font, color: INK });
    p2.drawText(it.status, { x: statusX, y: y2, size: 9.5, font: bold, color: col });
    y2 -= 12;
    p2.drawLine({ start: { x: M, y: y2 + 2 }, end: { x: pw - M, y: y2 + 2 }, thickness: 0.4, color: LINE });
    y2 -= 10;
  }
  y2 -= 6;
  p2.drawText(
    "Indicative prescription for this habitat type. When a management plan (HMMP / LEMP / Biodiversity Gain Plan) is imported, its contracted actions and schedule replace this list. Establishment status is derived from the Earth observation condition trajectory.",
    { x: M, y: y2, size: 7.5, font, color: MUTED, maxWidth: contentW, lineHeight: 10 },
  );

  drawFooter(p2, font, bold, docId, integrity, generatedAt);

  const bytes = await pdf.save();
  const filename = `biocoda-evidence-${parcelId}-Y${manifest.trajectory.year}.pdf`;
  return { bytes, filename };
}
