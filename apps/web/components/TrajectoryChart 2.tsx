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

const W = 720;
const H = 320;
const PAD = { top: 16, right: 16, bottom: 36, left: 40 };
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Actual-vs-required condition trajectory across the management period.
 * Required curve (dashed), EO-estimated actual (solid), field verifications
 * (dots). Pure SVG so it renders server-side with no client JS.
 */
export function TrajectoryChart(props: Props) {
  const { requiredCurve, eoSeries, verifications = [], baselineDate } = props;
  const baseline = new Date(`${baselineDate}T00:00:00Z`).getTime();
  const maxYear = MANAGEMENT_PERIOD_YEARS;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (year: number) => PAD.left + (Math.min(year, maxYear) / maxYear) * plotW;
  const y = (score: number) => PAD.top + (1 - score / 3) * plotH;

  const toYear = (iso: string) => (new Date(iso).getTime() - baseline) / MS_PER_YEAR;

  const requiredPath = requiredCurve
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(1)},${y(p.required).toFixed(1)}`)
    .join(" ");

  const actualPts = eoSeries.map((p) => ({ yr: toYear(p.capturedAt), v: p.value }));
  const actualPath = actualPts
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.yr).toFixed(1)},${y(p.v).toFixed(1)}`)
    .join(" ");

  const cx = x(props.currentYear);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Condition trajectory">
      {/* condition band gridlines */}
      {[1, 2, 3].map((s) => (
        <g key={s}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(s)} y2={y(s)} stroke="#e7e5e4" />
          <text x={4} y={y(s) + 4} fontSize="10" fill="#78716c">
            {s === 1 ? "Poor" : s === 2 ? "Mod" : "Good"}
          </text>
        </g>
      ))}
      {/* x axis ticks every 5 years */}
      {Array.from({ length: maxYear / 5 + 1 }, (_, i) => i * 5).map((yr) => (
        <g key={yr}>
          <line x1={x(yr)} x2={x(yr)} y1={PAD.top} y2={H - PAD.bottom} stroke="#f5f5f4" />
          <text x={x(yr)} y={H - PAD.bottom + 16} fontSize="10" fill="#78716c" textAnchor="middle">
            Y{yr}
          </text>
        </g>
      ))}

      {/* current-year marker */}
      <line x1={cx} x2={cx} y1={PAD.top} y2={H - PAD.bottom} stroke="#a8a29e" strokeDasharray="3 3" />
      <text x={cx + 3} y={PAD.top + 10} fontSize="10" fill="#57534e">
        now (Y{props.currentYear})
      </text>

      {/* target-year marker */}
      <line x1={x(props.byYear)} x2={x(props.byYear)} y1={PAD.top} y2={H - PAD.bottom} stroke="#D7DCD2" />

      {/* required curve */}
      <path d={requiredPath} fill="none" stroke="#3B7D3C" strokeWidth={1.5} strokeDasharray="5 4" />
      {/* actual EO curve */}
      <path
        d={actualPath}
        fill="none"
        stroke={props.status === "at_risk" ? "#c2410c" : "#26405F"}
        strokeWidth={2}
      />

      {/* verifications */}
      {verifications.map((v, i) => (
        <circle key={i} cx={x(toYear(v.at))} cy={y(v.score)} r={4} fill="#8E5BB5" stroke="#fff" />
      ))}

      {/* legend */}
      <g fontSize="10" fill="#57534e">
        <line x1={W - 250} x2={W - 232} y1={14} y2={14} stroke="#3B7D3C" strokeDasharray="5 4" />
        <text x={W - 228} y={17}>required</text>
        <line x1={W - 175} x2={W - 157} y1={14} y2={14} stroke="#26405F" strokeWidth={2} />
        <text x={W - 153} y={17}>EO actual</text>
        <circle cx={W - 78} cy={14} r={4} fill="#8E5BB5" />
        <text x={W - 70} y={17}>field</text>
      </g>
    </svg>
  );
}
