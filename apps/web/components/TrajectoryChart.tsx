import { MANAGEMENT_PERIOD_YEARS } from "@biocoda/shared";

interface Props {
  baselineDate: string;
  byYear: number;
  currentYear: number;
  status: "on_track" | "at_risk" | null;
  requiredCurve: { year: number; required: number }[];
  eoSeries: { capturedAt: string; value: number }[];
  verifications?: { at: string; score: number }[];
}

const W = 760;
const H = 340;
const PAD = { top: 22, right: 18, bottom: 38, left: 46 };
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

interface Pt {
  x: number;
  y: number;
}

/** Catmull-Rom smoothing -> cubic bezier path. */
function smooth(pts: Pt[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0]!.x},${pts[0]!.y}`;
  let d = `M${pts[0]!.x.toFixed(1)},${pts[0]!.y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Actual-vs-required condition trajectory across the management period, with
 * Defra condition-band zones, a gradient area fill, smoothed curves, and field
 * verifications. Pure SVG (renders server-side, no client JS).
 */
export function TrajectoryChart(props: Props) {
  const { requiredCurve, eoSeries, verifications = [], baselineDate } = props;
  const baseline = new Date(`${baselineDate}T00:00:00Z`).getTime();
  const maxYear = MANAGEMENT_PERIOD_YEARS;
  const atRisk = props.status === "at_risk";
  const accent = atRisk ? "#8E5BB5" : "#2F6B30";

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (year: number) => PAD.left + (Math.min(year, maxYear) / maxYear) * plotW;
  const y = (score: number) => PAD.top + (1 - score / 3) * plotH;
  const toYear = (iso: string) => (new Date(iso).getTime() - baseline) / MS_PER_YEAR;

  const reqPts = requiredCurve.map((p) => ({ x: x(p.year), y: y(p.required) }));
  const actPts = eoSeries.map((p) => ({ x: x(toYear(p.capturedAt)), y: y(p.value) }));
  const actualPath = smooth(actPts);
  const areaPath = actPts.length
    ? `${actualPath} L${actPts[actPts.length - 1]!.x.toFixed(1)},${y(0).toFixed(1)} L${actPts[0]!.x.toFixed(1)},${y(0).toFixed(1)} Z`
    : "";

  const cx = x(props.currentYear);
  const cyActual = actPts.length ? actPts[actPts.length - 1]!.y : y(0);

  const lastVal = eoSeries.length ? eoSeries[eoSeries.length - 1]!.value : null;
  const reqNow =
    requiredCurve.find((p) => p.year === props.currentYear)?.required ??
    requiredCurve[requiredCurve.length - 1]?.required;
  const summary =
    `Condition trajectory over ${maxYear} years. ` +
    (lastVal != null && reqNow != null
      ? `At year ${props.currentYear} the condition is about ${lastVal.toFixed(1)} of 3 against a required ${reqNow.toFixed(1)}, `
      : "") +
    `${atRisk ? "at risk" : "on track"}. Target condition due by year ${props.byYear}.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={summary}>
      <defs>
        <linearGradient id="bcArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* condition-band zones */}
      <rect x={PAD.left} y={y(3)} width={plotW} height={y(2) - y(3)} fill="#E9F0E4" />
      <rect x={PAD.left} y={y(2)} width={plotW} height={y(1) - y(2)} fill="#F4F5F1" />
      <rect x={PAD.left} y={y(1)} width={plotW} height={y(0) - y(1)} fill="#F7EFEA" />
      {[1, 2, 3].map((s) => (
        <g key={s}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(s)} y2={y(s)} stroke="#DCE5D7" />
          <text x={10} y={y(s) - 4} fontSize="10" fill="#5E5A50">
            {s === 1 ? "Poor" : s === 2 ? "Moderate" : "Good"}
          </text>
        </g>
      ))}

      {/* x-axis ticks */}
      {Array.from({ length: maxYear / 5 + 1 }, (_, i) => i * 5).map((yr) => (
        <text key={yr} x={x(yr)} y={H - PAD.bottom + 16} fontSize="10" fill="#5E5A50" textAnchor="middle">
          Y{yr}
        </text>
      ))}

      {/* target-year marker */}
      <line x1={x(props.byYear)} x2={x(props.byYear)} y1={PAD.top} y2={H - PAD.bottom} stroke="#BBD0B6" strokeDasharray="2 3" />
      <text x={x(props.byYear)} y={PAD.top - 8} fontSize="9.5" fill="#2F6B30" textAnchor="middle">
        target Y{props.byYear}
      </text>

      {/* area fill + curves */}
      {areaPath && <path d={areaPath} fill="url(#bcArea)" />}
      <path d={smooth(reqPts)} fill="none" stroke="#3B7D3C" strokeWidth={2} strokeDasharray="6 5" strokeLinecap="round" />
      <path d={actualPath} fill="none" stroke={accent} strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" />

      {/* now marker */}
      <line x1={cx} x2={cx} y1={PAD.top} y2={H - PAD.bottom} stroke="#18301A" strokeWidth={1} strokeDasharray="3 3" opacity={0.45} />
      <circle cx={cx} cy={cyActual} r={5} fill={accent} stroke="#fff" strokeWidth={2} />
      <g transform={`translate(${Math.min(cx + 8, W - 92)}, ${PAD.top + 2})`}>
        <rect width="84" height="18" rx="9" fill="#18301A" opacity="0.85" />
        <text x="42" y="12.5" fontSize="10" fill="#fff" textAnchor="middle">
          Now · Y{props.currentYear}
        </text>
      </g>

      {/* field verifications */}
      {verifications.map((v, i) => (
        <circle key={i} cx={x(toYear(v.at))} cy={y(v.score)} r={4.5} fill="#1f6f43" stroke="#fff" strokeWidth={1.5} />
      ))}

      {/* legend */}
      <g fontSize="10" fill="#5E5A50">
        <line x1={W - 268} x2={W - 248} y1={15} y2={15} stroke="#3B7D3C" strokeWidth={2} strokeDasharray="6 5" />
        <text x={W - 244} y={18.5}>required</text>
        <line x1={W - 188} x2={W - 168} y1={15} y2={15} stroke={accent} strokeWidth={2.75} />
        <text x={W - 164} y={18.5}>observed</text>
        <circle cx={W - 86} cy={15} r={4.5} fill="#1f6f43" />
        <text x={W - 78} y={18.5}>field</text>
      </g>
    </svg>
  );
}
