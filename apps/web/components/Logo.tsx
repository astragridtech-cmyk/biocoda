import { APP_NAME } from "@biocoda/shared";

/**
 * BioCoda logo: the trajectory-coda mark.
 *
 * A green trajectory rises from a baseline dot (the biodiversity gain) and
 * resolves into a violet coda arc and point (the musical coda, the close of
 * the 30-year movement). Geometry and colours are taken verbatim from the
 * finalized BioCoda logo system.
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 96 64"
      width={size}
      height={(size * 64) / 96}
      fill="none"
      style={{ overflow: "visible" }}
      role="img"
      aria-label="BioCoda"
    >
      <path
        d="M12 52 C 34 51, 54 44, 76 15"
        stroke="#3B7D3C"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx="12" cy="52" r="3.6" fill="#3B7D3C" />
      <path
        d="M68 13 A 8 8 0 0 1 84 13"
        stroke="#8E5BB5"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx="76" cy="15" r="3.8" fill="#8E5BB5" />
    </svg>
  );
}

/**
 * Full lockup: mark + wordmark. The wordmark is "Bio" in Meadow Green with
 * "Coda" carried in the Orchid accent, exactly as the BioCoda design system
 * specifies (Inter, tight tracking).
 */
export function Logo() {
  const coda = APP_NAME.toLowerCase().endsWith("coda")
    ? { head: APP_NAME.slice(0, -4), tail: APP_NAME.slice(-4) }
    : { head: APP_NAME, tail: "" };
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={28} />
      <span className="wordmark text-[20px] leading-none text-ink">
        {coda.head}
        {coda.tail && <span className="text-orchid">{coda.tail}</span>}
      </span>
    </span>
  );
}
