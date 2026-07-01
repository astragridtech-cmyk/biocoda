import Link from "next/link";

/** Faithful landing logo (light version) per the design handoff. */
function HeroLogo() {
  return (
    <span className="flex items-center" style={{ gap: 12 }}>
      <svg viewBox="0 0 96 64" width={42} height={28} fill="none" style={{ overflow: "visible" }} aria-hidden>
        <g stroke="#C2C8BC" strokeWidth={1.3} strokeLinecap="round">
          {[19, 28, 37, 46, 55, 64].map((x) => (
            <line key={x} x1={x} y1={54} x2={x} y2={58} />
          ))}
        </g>
        <path d="M12 52 C 34 51, 54 44, 76 15" stroke="#3B7D3C" strokeWidth={4} strokeLinecap="round" />
        <circle cx={12} cy={52} r={3.6} fill="#3B7D3C" />
        <path d="M68 13 A 8 8 0 0 1 84 13" stroke="#8E5BB5" strokeWidth={3} strokeLinecap="round" />
        <circle cx={76} cy={15} r={3.8} fill="#8E5BB5" />
      </svg>
      <span
        style={{
          fontFamily: "var(--font-poppins)",
          fontWeight: 600,
          fontSize: 25,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#3B7D3C" }}>Bio</span>
        <span style={{ color: "#8E5BB5" }}>Coda</span>
      </span>
    </span>
  );
}

const SCRIM_A =
  "linear-gradient(102deg, rgba(244,247,241,0.97) 0%, rgba(244,247,241,0.93) 24%, rgba(244,247,241,0.74) 42%, rgba(244,247,241,0.30) 56%, rgba(244,247,241,0) 70%)";
const SCRIM_B =
  "linear-gradient(to top, rgba(244,247,241,0.55) 0%, rgba(244,247,241,0) 26%)";

export default function LandingPage() {
  return (
    <div>
      {/* Hero (light version: dark text on a light scrim) */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          minHeight: "88vh",
          backgroundImage: "url('/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "78% 50%",
        }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: SCRIM_A }} />
        <div className="pointer-events-none absolute inset-0" style={{ background: SCRIM_B }} />

        {/* Nav */}
        <header className="relative z-10 flex items-center justify-between px-6 py-7 lg:px-14">
          <HeroLogo />
          <nav className="flex items-center gap-5 sm:gap-[30px]">
            <a href="#how" className="hidden text-[15px] font-medium text-[#2E4A2E] hover:text-forest sm:inline">
              How it works
            </a>
            <a href="#how" className="hidden text-[15px] font-medium text-[#2E4A2E] hover:text-forest md:inline">
              For responsible bodies
            </a>
            <Link
              href="/login"
              className="rounded-[9px] border-[1.5px] px-5 py-[9px] text-sm font-semibold text-[#245024] hover:bg-white/60"
              style={{ borderColor: "rgba(36,80,36,0.28)" }}
            >
              Sign in
            </Link>
          </nav>
        </header>

        {/* Content */}
        <div className="relative z-10 max-w-[760px] px-6 pt-10 lg:px-14 lg:pt-[62px]">
          {/* Kicker */}
          <span
            className="mb-[30px] inline-flex items-center"
            style={{
              gap: 9,
              padding: "7px 16px 7px 13px",
              borderRadius: 999,
              background: "rgba(59,125,60,0.10)",
              border: "1px solid rgba(59,125,60,0.26)",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "#3B7D3C" }} />
            <span
              className="text-[12px] font-semibold uppercase"
              style={{ letterSpacing: "0.13em", color: "#2E5A2F" }}
            >
              30-year BNG habitat monitoring
            </span>
          </span>

          {/* Headline */}
          <h1
            className="font-serif"
            style={{
              fontWeight: 500,
              fontSize: "clamp(34px, 5.2vw, 67px)",
              lineHeight: 1.08,
              letterSpacing: "-0.012em",
              color: "#22451F",
              marginBottom: 26,
              textWrap: "balance",
            }}
          >
            Prove your Biodiversity Net Gain{" "}
            <span style={{ fontStyle: "italic", color: "#3B7D3C" }}>is on trajectory</span>, for the
            full thirty years.
          </h1>

          {/* Subhead */}
          <p
            style={{
              fontSize: 20,
              lineHeight: 1.5,
              maxWidth: 520,
              marginBottom: 38,
              color: "#4A463E",
            }}
          >
            Earth observation, field verification and the Defra Metric, in one record.
          </p>

          {/* Buttons */}
          <div className="mb-10 flex flex-wrap items-center" style={{ gap: 14 }}>
            <a
              href="#how"
              className="inline-flex items-center text-white"
              style={{
                gap: 11,
                padding: "15px 26px",
                borderRadius: 11,
                background: "#3B7D3C",
                fontWeight: 600,
                fontSize: 16,
                boxShadow: "0 10px 26px rgba(59,125,60,0.30)",
              }}
            >
              See how it works <span style={{ fontSize: 18 }} aria-hidden>&rarr;</span>
            </a>
            <a
              href="mailto:astragridtech@gmail.com?subject=BioCoda%20walkthrough"
              className="inline-flex items-center"
              style={{
                padding: "15px 26px",
                borderRadius: 11,
                border: "1.5px solid rgba(36,80,36,0.22)",
                background: "rgba(255,255,255,0.7)",
                color: "#245024",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Book a walkthrough
            </a>
          </div>

          {/* Credibility row */}
          <div className="flex flex-wrap items-center" style={{ gap: 18 }}>
            {["Linked to the Metric baseline", "Verified in the field", "Annual evidence pack"].map(
              (label, i) => (
                <span key={label} className="flex items-center" style={{ gap: 18 }}>
                  {i > 0 && (
                    <span style={{ width: 4, height: 4, borderRadius: 999, background: "#9A9E94" }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: "#5E5A50" }}>
                    {label}
                  </span>
                </span>
              ),
            )}
          </div>
        </div>

        {/* Signature */}
        <p
          className="absolute z-10 font-serif"
          style={{ left: 56, bottom: 38, fontStyle: "italic", fontSize: 18, color: "#3C5A39" }}
        >
          Thirty years of habitat, on the record.
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="bg-canvas">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-ink">How it works</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Long-horizon condition monitoring of habitat parcels at scale, the 30-year tail that
            site visits alone cannot service.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                t: "See the 30-year tail",
                d: "Per-parcel condition against the required trajectory, with on-track and at-risk flags and early warning when a habitat slips behind.",
              },
              {
                t: "Earth observation at scale",
                d: "Long-horizon Earth observation condition monitoring across every parcel, because nobody can afford 30 years of frequent site visits.",
              },
              {
                t: "Verified in the field",
                d: "Targeted ecologist surveys ground-truth the Earth observation signal and capture condition to recognised criteria, geotagged to the parcel.",
              },
            ].map((c) => (
              <div key={c.t} className="card p-5">
                <div className="text-base font-semibold text-ink">{c.t}</div>
                <p className="mt-2 text-sm text-muted">{c.d}</p>
              </div>
            ))}
          </div>

          <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <div className="font-semibold text-ink">Linked to the Metric, verified in the field.</div>
              <p className="mt-1 max-w-2xl text-sm text-muted">
                Each parcel ties back to its Defra Metric baseline and target units. Earth observation
                is decision support; field verification is authoritative. UK data residency, role-based access.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-md bg-moss px-5 py-2.5 text-sm font-medium text-white hover:bg-leaf"
            >
              Sign in to BioCoda
            </Link>
          </div>

          <footer className="mt-12 text-xs text-muted">
            BioCoda by Astragrid Technologies. Indicative product for evaluation. Not financial or legal advice.
          </footer>
        </div>
      </section>
    </div>
  );
}
