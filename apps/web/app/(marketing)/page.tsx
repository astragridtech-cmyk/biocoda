import Link from "next/link";
import type { Metadata } from "next";

/**
 * BioCoda marketing home page. Recreated from the high-fidelity design handoff
 * (design_handoff_biocoda_landing_page). Server component, no client state:
 * anchor navigation, one primary conversion (Book a demo). British English, no
 * em-dashes, acronyms spelled out. Fonts come from the next/font CSS variables
 * (Poppins wordmark, Spectral headlines, Inter body).
 */

const SANS = "var(--font-inter), system-ui, sans-serif";
const SERIF = "var(--font-serif), Georgia, serif";
const POP = "var(--font-poppins), sans-serif";
const DEMO = "mailto:astragridtech@gmail.com?subject=BioCoda%20demo";

export const metadata: Metadata = {
  title: "BioCoda: Biodiversity Net Gain habitat monitoring software",
  description:
    "BioCoda is Biodiversity Net Gain habitat monitoring software for the 30-year obligation. Monitor every habitat parcel from space with Copernicus Sentinel-2, measure it against contracted condition, and prove compliance with tamper-evident evidence packs.",
};

function Check({ color = "#3B7D3C", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Eyebrow({ children, color = "#8E5BB5" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ font: `600 13px ${SANS}`, letterSpacing: "0.13em", textTransform: "uppercase", color, marginBottom: 16 }}>
      {children}
    </div>
  );
}

const STEPS = [
  { n: "1", title: "Bring in the plan or boundary.", body: "Extract every parcel, its baseline and target condition, the target year and the management actions from a management plan, with the source clause recorded. Or upload an Area of Interest boundary file.", terra: false },
  { n: "2", title: "Set the required trajectory.", body: "Each parcel gets the minimum condition it must hold each year, rising from baseline to target and then held.", terra: false },
  { n: "3", title: "Monitor from space.", body: "Copernicus Sentinel-2 imagery estimates condition continuously; every parcel is classified on track, at risk or awaiting a baseline.", terra: false },
  { n: "4", title: "Verify on the ground.", body: "Dispatch a field survey to a flagged parcel; the ecologist's geotagged assessment becomes the authoritative record and can confirm or override the satellite signal.", terra: false },
  { n: "5", title: "Prove it.", body: "Export a timestamped, tamper-evident evidence pack for any parcel, with before and after imagery, the condition metrics and the management progress.", terra: true },
];

const FEATURES = [
  { tint: "#EAF3E6", title: "Explainable condition trajectory.", body: "Every parcel measured against the curve it is contracted to follow, with the gap and the on track or at risk status shown.", icon: <><path d="M4 18c5-1 8-8 16-13" stroke="#3B7D3C" strokeWidth={2.2} strokeLinecap="round" /><circle cx="4" cy="18" r="2" fill="#3B7D3C" /><circle cx="19" cy="6" r="2" fill="#8E5BB5" /></> },
  { tint: "#F1EAF7", title: "Decision support, with authority intact.", body: "Earth observation flags where to look; the ecologist certifies. The distinction is built in, which is what makes the evidence defensible.", icon: <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="#8E5BB5" strokeWidth={2} strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="#8E5BB5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></> },
  { tint: "#EAF3E6", title: "Habitat change detection.", body: "Before and after Copernicus Sentinel-2 imagery for any two periods, with a vegetation-change map confined to the parcel and synced pan and zoom.", icon: <><rect x="3" y="4" width="8" height="16" rx="1.5" stroke="#3B7D3C" strokeWidth={2} /><rect x="13" y="4" width="8" height="16" rx="1.5" stroke="#8E5BB5" strokeWidth={2} /></> },
  { tint: "#EAF3E6", title: "Plan ingestion with provenance.", body: "Pull parcels, targets and actions from plan documents, with the source clause kept for the evidence trail and a review step before anything is committed.", icon: <><path d="M7 3h7l4 4v14H7z" stroke="#3B7D3C" strokeWidth={2} strokeLinejoin="round" /><path d="M14 3v4h4M10 13h5M10 16h5" stroke="#8E5BB5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></> },
  { tint: "#F1EAF7", title: "The whole portfolio, at any year.", body: "A 30-year time scrubber to view the estate at any management year, with early warnings when a habitat slips behind.", icon: <><circle cx="12" cy="12" r="9" stroke="#8E5BB5" strokeWidth={2} /><path d="M12 7v5l3 2" stroke="#8E5BB5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></> },
  { tint: "#EAF3E6", title: "Tamper-evident evidence packs.", body: "Branded reports with timestamped imagery, metrics and progress, and a cryptographic integrity check so any alteration is detectable.", icon: <><rect x="4" y="3" width="16" height="18" rx="2" stroke="#3B7D3C" strokeWidth={2} /><path d="M8 9h8M8 13h5" stroke="#5E5A50" strokeWidth={2} strokeLinecap="round" /><circle cx="16.5" cy="16.5" r="3.2" fill="#fff" stroke="#8E5BB5" strokeWidth={2} /><path d="M15.2 16.5l.9.9 1.6-1.7" stroke="#8E5BB5" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></> },
];

const OUTCOMES = [
  { title: "Catch failures early.", body: "Continuous monitoring flags a slipping habitat in months, not years.", icon: <><path d="M12 2v4M12 8a5 5 0 0 1 5 5c0 3-2 4-2 6H9c0-2-2-3-2-6a5 5 0 0 1 5-5z" stroke="#3B7D3C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /><path d="M9 21h6" stroke="#3B7D3C" strokeWidth={2} strokeLinecap="round" /></> },
  { title: "Target scarce expertise.", body: "Send ecologists exactly where the satellite says they are needed, so field budgets go where they matter.", icon: <><circle cx="12" cy="12" r="9" stroke="#3B7D3C" strokeWidth={2} /><circle cx="12" cy="12" r="4.5" stroke="#3B7D3C" strokeWidth={2} /><circle cx="12" cy="12" r="1.6" fill="#8E5BB5" /></> },
  { title: "Defensible compliance.", body: "A complete evidence trail from plan clause to Defra Biodiversity Metric to a tamper-evident pack.", icon: <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="#3B7D3C" strokeWidth={2} strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="#3B7D3C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></> },
  { title: "Lower monitoring cost.", body: "Free, science-grade Copernicus data does the continuous watching, so there is no per-scene imagery bill.", icon: <path d="M12 3v18M8 7h6a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h7" stroke="#3B7D3C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /> },
];

const SECURITY = [
  { text: "United Kingdom data residency.", violet: false },
  { text: "Least-privilege roles and database row-level security, so each organisation sees only its own data.", violet: false },
  { text: "Complete audit trail.", violet: false },
  { text: "Tamper-evident evidence packs, with a cryptographic integrity hash.", violet: false },
  { text: "Earth observation is decision support; field verification is authoritative.", violet: true },
];

const FOOTER_COLS = [
  { head: "Product", links: [["Product", "#product"], ["How it works", "#how-it-works"], ["Evidence", "#evidence"], ["Security", "#security"], ["Pricing", "#pricing"]] },
  { head: "Company", links: [["About", "#"], ["Contact", DEMO]] },
  { head: "Legal", links: [["Privacy", "#"], ["Terms", "#"], ["Accessibility statement", "#"]] },
];

const cardShadow = "0 1px 2px rgba(24,48,26,0.04), 0 10px 26px rgba(24,48,26,0.04)";
const sectionH2 = (size = "clamp(30px,4vw,46px)", color = "#18301A"): React.CSSProperties => ({
  fontFamily: SERIF, fontWeight: 600, fontSize: size, lineHeight: 1.1, letterSpacing: "-0.01em", color, textWrap: "balance" as never,
});

function Wordmark({ size = 23, tail = "#8E5BB5", head = "#3B7D3C" }: { size?: number; tail?: string; head?: string }) {
  return (
    <span style={{ fontFamily: POP, fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", color: head, lineHeight: 1 }}>
      Bio<span style={{ color: tail }}>Coda</span>
    </span>
  );
}

/** The trajectory-coda mark with baseline ticks (matches the handoff SVG). */
function Mark({ w = 44, greens = "#3B7D3C", violet = "#8E5BB5", ticks = "#C2C8BC" }: { w?: number; greens?: string; violet?: string; ticks?: string }) {
  return (
    <svg viewBox="0 0 96 64" width={w} height={(w * 64) / 96} fill="none" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      <g stroke={ticks} strokeWidth={1.4} strokeLinecap="round">
        {[19, 28, 37, 46, 55, 64].map((x) => <line key={x} x1={x} y1={55} x2={x} y2={59} />)}
      </g>
      <path d="M12 52 C 34 51, 54 44, 76 15" stroke={greens} strokeWidth={4.5} strokeLinecap="round" />
      <circle cx="12" cy="52" r={4} fill={greens} />
      <path d="M68 13 A 8 8 0 0 1 84 13" stroke={violet} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx="76" cy="15" r={4.4} fill={violet} />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: "#fff", color: "#18301A" }}>
      <a href="#main" className="skip">Skip to main content</a>

      {/* HEADER / NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid #DCE5D7" }}>
        <div className="hero-pad" style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "16px 40px" }}>
          <a href="#main" aria-label="BioCoda home" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", flexShrink: 0 }}>
            <Mark />
            <Wordmark />
          </a>
          <nav className="nav-links" aria-label="Primary" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[["Product", "#product"], ["How it works", "#how-it-works"], ["Evidence", "#evidence"], ["Security", "#security"], ["Pricing", "#pricing"]].map(([label, href]) => (
              <a key={href} href={href} style={{ font: `500 15px ${SANS}`, color: "#18301A", textDecoration: "none" }}>{label}</a>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
            <Link href="/login" style={{ font: `600 15px ${SANS}`, color: "#245024", textDecoration: "none" }}>Sign in</Link>
            <a href="#book" style={{ font: `600 15px ${SANS}`, color: "#fff", textDecoration: "none", background: "#3B7D3C", padding: "11px 20px", borderRadius: 11, boxShadow: "0 6px 16px rgba(59,125,60,0.24)" }}>Book a demo</a>
          </div>
        </div>
      </header>

      <main id="main">
        {/* HERO */}
        <section style={{ background: "#fff", borderBottom: "1px solid #DCE5D7", overflow: "hidden" }}>
          <div style={{ position: "relative", backgroundImage: "linear-gradient(100deg,rgba(22,42,30,0.90) 0%,rgba(24,44,32,0.74) 34%,rgba(26,46,34,0.40) 54%,rgba(28,48,36,0.12) 70%,rgba(28,48,36,0) 84%),url('/cta-meadow-bees.png')", backgroundSize: "cover", backgroundPosition: "center 34%" }}>
            <div className="hero-pad" style={{ maxWidth: 1240, margin: "0 auto", padding: "96px 40px 104px", position: "relative" }}>
              <div style={{ maxWidth: 640, textAlign: "left" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.32)", borderRadius: 999, padding: "7px 16px 7px 13px", marginBottom: 26 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#BFE0BC" }} />
                  <span style={{ font: `600 12.5px ${SANS}`, letterSpacing: "0.11em", textTransform: "uppercase", color: "#EAF3E6" }}>Biodiversity Net Gain monitoring, done properly</span>
                </div>
                <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(38px,6vw,68px)", lineHeight: 1.06, letterSpacing: "-0.015em", color: "#fff", maxWidth: "15ch", margin: "0 0 26px", textWrap: "balance" as never, textShadow: "0 2px 26px rgba(8,20,6,0.45)" }}>
                  Thirty years of habitat, <span style={{ fontStyle: "italic", fontWeight: 500, color: "#DCC4EE" }}>on the record.</span>
                </h1>
                <p style={{ font: `400 clamp(17px,1.6vw,20px)/1.6 ${SANS}`, color: "rgba(255,255,255,0.92)", maxWidth: "60ch", margin: "0 0 34px", textWrap: "pretty" as never, textShadow: "0 1px 14px rgba(8,20,6,0.35)" }}>
                  BioCoda helps responsible bodies, planning authorities and developers monitor every Biodiversity Net Gain habitat from space, measure it against the condition it is contracted to reach, flag the parcels slipping behind, and prove compliance with a tamper-evident evidence trail. Satellite monitoring at scale, verified by ecologists on the ground.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
                  <a href="#book" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#3B7D3C", color: "#fff", font: `600 16px ${SANS}`, textDecoration: "none", padding: "15px 28px", borderRadius: 12, boxShadow: "0 12px 28px rgba(8,20,6,0.35)" }}>Book a demo <span aria-hidden="true" style={{ fontSize: 18 }}>&rarr;</span></a>
                  <a href="#how-it-works" style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.12)", color: "#fff", font: `600 16px ${SANS}`, textDecoration: "none", padding: "15px 28px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.42)" }}>See how it works</a>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard mock */}
          <div className="hero-pad" style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 40px 0" }}>
            <figure role="img" aria-label="BioCoda dashboard showing the portfolio satellite map with parcels coloured by status, a 30-year time scrubber and headline condition figures" style={{ margin: 0 }}>
              <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(24,48,26,0.18), 0 4px 14px rgba(24,48,26,0.08)", border: "1px solid #DCE5D7", background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#F1F4EE", borderBottom: "1px solid #DCE5D7" }}>
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#E4A5A0" }} />
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#E9CE96" }} />
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#A9CBA0" }} />
                  <div style={{ flex: 1, margin: "0 8px", display: "flex", justifyContent: "center" }}>
                    <span style={{ font: `500 13px ${SANS}`, color: "#5E5A50", background: "#fff", border: "1px solid #DCE5D7", borderRadius: 8, padding: "5px 40px" }}>biocoda.astragrid.tech</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px", borderBottom: "1px solid #EAF0E5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
                    <Wordmark size={17} />
                    <span style={{ font: `600 13.5px ${SANS}`, color: "#245024", background: "#EAF3E6", padding: "5px 12px", borderRadius: 8 }}>Portfolio</span>
                    <span style={{ font: `500 13.5px ${SANS}`, color: "#5E5A50" }}>Digest</span>
                    <span style={{ font: `500 13.5px ${SANS}`, color: "#5E5A50" }}>Import plan</span>
                  </div>
                  <span style={{ font: `500 12.5px ${SANS}`, color: "#8A8578" }}>Lens · Responsible body: evidence and 30-year risk</span>
                </div>
                <div style={{ margin: "18px 22px 0", border: "1px solid #E6ECE1", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ font: `600 10.5px ${SANS}`, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8578", whiteSpace: "nowrap" }}>Management year</span>
                    <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 26, color: "#18301A", lineHeight: 1 }}>09</span>
                    <span style={{ font: `500 13px ${SANS}`, color: "#8A8578" }}>/ 30 · 2034</span>
                    <div style={{ flex: 1, position: "relative", height: 4, background: "#E6ECE1", borderRadius: 99, margin: "0 4px" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "30%", background: "#8E5BB5", borderRadius: 99 }} />
                      <div style={{ position: "absolute", left: "30%", top: "50%", transform: "translate(-50%,-50%)", width: 16, height: 16, background: "#fff", border: "3px solid #8E5BB5", borderRadius: "50%", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} />
                    </div>
                    <span style={{ font: `500 11px ${SANS}`, color: "#8E5BB5" }}>Target</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, padding: "16px 22px 0" }}>
                  {[["On track", "15", "#3B7D3C", "38% of portfolio"], ["At risk", "18", "#8E5BB5", "47 ha off trajectory"], ["Awaiting Earth observation", "7", "#9A9E94", "no baseline captured yet"], ["Portfolio condition", "2.22", "#18301A", "mean score · target 3.00"]].map(([label, val, color, sub]) => (
                    <div key={label} style={{ border: "1px solid #E6ECE1", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ font: `600 10px ${SANS}`, letterSpacing: "0.09em", textTransform: "uppercase", color: "#8A8578", marginBottom: 6 }}>{label}</div>
                      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 30, color, lineHeight: 1 }}>{val}</div>
                      <div style={{ font: `400 11.5px ${SANS}`, color: "#8A8578", marginTop: 5 }}>{sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "16px 22px 22px" }}>
                  <div style={{ position: "relative", aspectRatio: "1140 / 300", borderRadius: 12, overflow: "hidden", border: "1px solid #E6ECE1", backgroundImage: "url('/portfolio-map.jpg')", backgroundSize: "cover", backgroundPosition: "center 42%" }}>
                    {[["55%", "26%", "#3B7D3C"], ["50%", "38%", "#3B7D3C"], ["54%", "66%", "#8E5BB5"], ["58%", "50%", "#3B7D3C"], ["49%", "78%", "#9A9E94"]].map(([l, t, c], i) => (
                      <span key={i} style={{ position: "absolute", left: l, top: t, width: 15, height: 15, borderRadius: "50%", background: c, border: "3px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.35)" }} />
                    ))}
                    <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 4, background: "rgba(255,255,255,0.92)", borderRadius: 9, padding: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                      <span style={{ font: `600 11px ${SANS}`, color: "#fff", background: "#3B7D3C", padding: "4px 10px", borderRadius: 6 }}>Satellite</span>
                      <span style={{ font: `500 11px ${SANS}`, color: "#5E5A50", padding: "4px 8px" }}>Sentinel-2</span>
                      <span style={{ font: `500 11px ${SANS}`, color: "#5E5A50", padding: "4px 8px" }}>Light</span>
                    </div>
                    <div style={{ position: "absolute", bottom: 10, right: 10, font: `500 10px ${SANS}`, color: "#fff", background: "rgba(20,30,20,0.55)", padding: "4px 8px", borderRadius: 6 }}>Imagery © Esri, Maxar</div>
                    <div style={{ position: "absolute", bottom: 10, left: 12, display: "flex", gap: 14, background: "rgba(255,255,255,0.92)", borderRadius: 8, padding: "6px 10px" }}>
                      {[["On track", "#3B7D3C"], ["At risk", "#8E5BB5"], ["Awaiting Earth observation", "#9A9E94"]].map(([label, c]) => (
                        <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5, font: `500 10.5px ${SANS}`, color: "#5E5A50" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </figure>
          </div>

          {/* Trust strip */}
          <div className="hero-pad" style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 40px 64px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "14px 28px" }}>
              {["United Kingdom data residency", "Row-level security", "Complete audit trail", "Copernicus Sentinel-2", "Field-verified"].map((label, i) => (
                <span key={label} style={{ display: "contents" }}>
                  {i > 0 && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#C2C8BC" }} />}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, font: `500 14px ${SANS}`, color: "#4A463E" }}><Check />{label}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section id="product" style={{ padding: "96px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ maxWidth: "60ch", marginBottom: 52 }}>
              <Eyebrow>The problem</Eyebrow>
              <h2 style={{ ...sectionH2(), marginBottom: 22 }}>A 30-year duty that outlasts everyone watching it.</h2>
              <p style={{ font: `400 clamp(16px,1.4vw,18px)/1.7 ${SANS}`, color: "#5E5A50", textWrap: "pretty" as never }}>Biodiversity Net Gain requires most development in England to deliver at least a 10 percent net gain in biodiversity, secured and maintained for a minimum of 30 years. In practice that obligation is checked by the occasional site visit, so a habitat can quietly degrade for years before anyone notices. Responsible bodies, councils and developers carry the risk and the scrutiny, with very little continuous visibility.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
              {[["10%", "minimum net gain, in law"], ["30 years", "secured, per site"], ["2024", "mandatory across England since"]].map(([stat, sub]) => (
                <div key={sub} style={{ border: "1px solid #DCE5D7", borderRadius: 14, padding: 28, background: "#EFF3EC" }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 44, color: "#3B7D3C", lineHeight: 1, marginBottom: 12 }}>{stat}</div>
                  <div style={{ font: `500 15.5px ${SANS}`, color: "#4A463E" }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" style={{ padding: "96px 24px", background: "#EFF3EC", borderTop: "1px solid #DCE5D7", borderBottom: "1px solid #DCE5D7" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ maxWidth: "60ch", marginBottom: 56 }}>
              <Eyebrow>How it works</Eyebrow>
              <h2 style={sectionH2()}>From plan to proof, in one place.</h2>
            </div>
            <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 18 }}>
              {STEPS.map((s) => (
                <li key={s.n} style={{ display: "flex", gap: 22, alignItems: "flex-start", background: "#fff", border: "1px solid #DCE5D7", borderRadius: 14, padding: "26px 28px", boxShadow: "0 1px 2px rgba(24,48,26,0.04)" }}>
                  <span style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: s.terra ? "#F3E9CE" : "#EAF3E6", color: s.terra ? "#C2410C" : "#3B7D3C", fontFamily: SERIF, fontWeight: 700, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.n}</span>
                  <div>
                    <h3 style={{ font: `600 19px ${SANS}`, color: "#18301A", marginBottom: 7 }}>{s.title}</h3>
                    <p style={{ font: `400 16px/1.6 ${SANS}`, color: "#5E5A50", textWrap: "pretty" as never }}>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FEATURES */}
        <section id="evidence" style={{ padding: "96px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ maxWidth: "60ch", marginBottom: 52 }}>
              <Eyebrow>What it does</Eyebrow>
              <h2 style={sectionH2()}>Built for the 30-year obligation, not generic mapping.</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 22 }}>
              {FEATURES.map((f) => (
                <div key={f.title} style={{ border: "1px solid #DCE5D7", borderRadius: 14, padding: 30, background: "#fff", boxShadow: cardShadow }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: f.tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">{f.icon}</svg>
                  </div>
                  <h3 style={{ font: `600 19px ${SANS}`, color: "#18301A", marginBottom: 9 }}>{f.title}</h3>
                  <p style={{ font: `400 15.5px/1.6 ${SANS}`, color: "#5E5A50", textWrap: "pretty" as never }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCT SHOWCASE (MAP) */}
        <section style={{ padding: "96px 24px", background: "#26405F", color: "#fff" }}>
          <div className="two-col" style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 52, alignItems: "center" }}>
            <div>
              <Eyebrow color="#CBA6E4">Portfolio view</Eyebrow>
              <h2 style={{ ...sectionH2("clamp(30px,4vw,44px)", "#fff"), lineHeight: 1.12, marginBottom: 22 }}>See the whole portfolio at a glance.</h2>
              <p style={{ font: `400 clamp(16px,1.4vw,17.5px)/1.7 ${SANS}`, color: "rgba(255,255,255,0.82)", textWrap: "pretty" as never }}>A satellite map shows every parcel coloured by status, alongside the 30-year time scrubber, filters, and layered views for condition, habitat, Earth observation recency and field verification. Open any parcel to see its trajectory, its before and after imagery and its evidence pack.</p>
            </div>
            <figure role="img" aria-label="Portfolio satellite map screenshot showing parcels across the United Kingdom coloured by status, with condition, habitat, Earth observation and verification layer toggles" style={{ margin: 0 }}>
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.16)", boxShadow: "0 30px 70px rgba(0,0,0,0.35)", background: "#1c3247" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <div>
                    <div style={{ font: `600 15px ${SANS}`, color: "#fff" }}>Portfolio map</div>
                    <div style={{ font: `400 12px ${SANS}`, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Condition status: on track, at risk, awaiting Earth observation</div>
                  </div>
                  <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.08)", borderRadius: 9, padding: 4 }}>
                    <span style={{ font: `600 11.5px ${SANS}`, color: "#fff", background: "#3B7D3C", padding: "5px 11px", borderRadius: 6 }}>Condition</span>
                    {["Habitat", "Earth observation", "Verification"].map((t) => (
                      <span key={t} style={{ font: `500 11.5px ${SANS}`, color: "rgba(255,255,255,0.72)", padding: "5px 9px" }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ position: "relative", aspectRatio: "640 / 360", backgroundImage: "url('/portfolio-map.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>
                  {[["55%", "30%", "#3B7D3C"], ["58%", "44%", "#3B7D3C"], ["48%", "39%", "#8E5BB5"], ["56%", "67%", "#3B7D3C"], ["49%", "72%", "#9A9E94"], ["52%", "56%", "#3B7D3C"]].map(([l, t, c], i) => (
                    <span key={i} style={{ position: "absolute", left: l, top: t, width: 16, height: 16, borderRadius: "50%", background: c, border: "3px solid #fff", boxShadow: "0 1px 5px rgba(0,0,0,0.4)" }} />
                  ))}
                  <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 4, background: "rgba(255,255,255,0.92)", borderRadius: 9, padding: 4 }}>
                    <span style={{ font: `600 11px ${SANS}`, color: "#fff", background: "#3B7D3C", padding: "4px 10px", borderRadius: 6 }}>Satellite</span>
                    <span style={{ font: `500 11px ${SANS}`, color: "#5E5A50", padding: "4px 8px" }}>Sentinel-2</span>
                    <span style={{ font: `500 11px ${SANS}`, color: "#5E5A50", padding: "4px 8px" }}>Light</span>
                  </div>
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", flexDirection: "column", gap: 1, borderRadius: 7, overflow: "hidden" }}>
                    {["+", "−"].map((s) => (
                      <span key={s} style={{ width: 30, height: 30, background: "#fff", color: "#26405F", font: `600 18px ${SANS}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ position: "absolute", bottom: 10, right: 10, font: `500 10px ${SANS}`, color: "#fff", background: "rgba(20,30,20,0.55)", padding: "4px 8px", borderRadius: 6 }}>Imagery © Esri, Maxar, Earthstar Geographics</div>
                </div>
              </div>
            </figure>
          </div>
        </section>

        {/* OUTCOMES */}
        <section style={{ padding: "96px 24px", background: "#fff" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ maxWidth: "60ch", marginBottom: 52 }}>
              <Eyebrow>Outcomes</Eyebrow>
              <h2 style={sectionH2()}>What good looks like.</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 22 }}>
              {OUTCOMES.map((o) => (
                <div key={o.title} style={{ border: "1px solid #DCE5D7", borderRadius: 14, padding: 28, background: "#fff" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: "#EAF3E6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">{o.icon}</svg>
                  </div>
                  <h3 style={{ font: `600 18px ${SANS}`, color: "#18301A", marginBottom: 8 }}>{o.title}</h3>
                  <p style={{ font: `400 15px/1.6 ${SANS}`, color: "#5E5A50", textWrap: "pretty" as never }}>{o.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section id="security" style={{ padding: "96px 24px", background: "#EFF3EC", borderTop: "1px solid #DCE5D7", borderBottom: "1px solid #DCE5D7" }}>
          <div className="two-col" style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 52 }}>
            <div>
              <Eyebrow>Security and data</Eyebrow>
              <h2 style={{ ...sectionH2("clamp(30px,4vw,44px)"), lineHeight: 1.12, marginBottom: 22 }}>Evidence-grade, and built to be trusted.</h2>
              <p style={{ font: `400 clamp(16px,1.4vw,17.5px)/1.7 ${SANS}`, color: "#5E5A50", textWrap: "pretty" as never }}>BioCoda holds long-term compliance data for real sites, so access control, audit and data residency are treated as acceptance gates.</p>
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
              {SECURITY.map((item) => (
                <li key={item.text} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "#fff", border: "1px solid #DCE5D7", borderRadius: 12, padding: "18px 20px" }}>
                  <span style={{ flexShrink: 0, marginTop: 1 }}><Check color={item.violet ? "#8E5BB5" : "#3B7D3C"} size={22} /></span>
                  <span style={{ font: `500 15.5px/1.5 ${SANS}`, color: "#18301A" }}>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ padding: "96px 24px", background: "#EFF3EC", borderTop: "1px solid #DCE5D7" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <Eyebrow>Pricing</Eyebrow>
            <h2 style={{ ...sectionH2(), marginBottom: 22 }}>Start with a pilot.</h2>
            <p style={{ font: `400 clamp(16px,1.4vw,18px)/1.7 ${SANS}`, color: "#5E5A50", marginBottom: 34, textWrap: "pretty" as never }}>Annual licence per organisation, scaled by portfolio size, with the Earth observation monitoring module. Begin with a paid pilot on your own sites and your own plans. Not a self-serve checkout; this is a conversation.</p>
            <a href="#book" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#3B7D3C", color: "#fff", font: `600 16px ${SANS}`, textDecoration: "none", padding: "15px 30px", borderRadius: 12, boxShadow: "0 12px 28px rgba(59,125,60,0.24)" }}>Book a pilot <span aria-hidden="true" style={{ fontSize: 18 }}>&rarr;</span></a>
          </div>
        </section>

        {/* FINAL CTA BAND */}
        <section id="book" style={{ position: "relative", padding: "104px 24px", backgroundImage: "linear-gradient(120deg,rgba(30,52,40,0.94) 0%,rgba(30,52,40,0.82) 45%,rgba(38,64,95,0.72) 100%),url('/hero-meadow.png')", backgroundSize: "cover", backgroundPosition: "center", overflow: "hidden" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(32px,4.6vw,52px)", lineHeight: 1.08, letterSpacing: "-0.012em", color: "#fff", marginBottom: 18, textWrap: "balance" as never, textShadow: "0 2px 24px rgba(8,20,6,0.4)" }}>Thirty years of habitat, on the record.</h2>
            <p style={{ font: `400 clamp(17px,1.6vw,20px)/1.6 ${SANS}`, color: "rgba(255,255,255,0.92)", marginBottom: 36 }}>Book a demo and see BioCoda on a real portfolio.</p>
            <a href={DEMO} style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#8E5BB5", color: "#fff", font: `600 17px ${SANS}`, textDecoration: "none", padding: "16px 34px", borderRadius: 12, boxShadow: "0 16px 36px rgba(0,0,0,0.35)" }}>Book a demo <span aria-hidden="true" style={{ fontSize: 18 }}>&rarr;</span></a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#18301A", color: "rgba(255,255,255,0.72)", padding: "64px 24px 40px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40, paddingBottom: 44, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
                <Mark w={42} greens="#7FB97F" violet="#CBA6E4" ticks="rgba(255,255,255,0.35)" />
                <Wordmark size={22} head="#fff" tail="#CBA6E4" />
              </div>
              <p style={{ font: `400 14px/1.6 ${SANS}`, color: "rgba(255,255,255,0.6)", maxWidth: "32ch" }}>Biodiversity Net Gain habitat monitoring for the 30-year obligation.</p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.head}>
                <div style={{ font: `600 12px ${SANS}`, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{col.head}</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11 }}>
                  {col.links.map(([label, href]) => (
                    <li key={label}><a href={href} style={{ font: `400 14.5px ${SANS}`, color: "rgba(255,255,255,0.78)", textDecoration: "none" }}>{label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ font: `400 13.5px ${SANS}`, color: "rgba(255,255,255,0.6)" }}>BioCoda by Astragrid Technologies Ltd. © 2026</p>
            <p style={{ font: `400 12.5px/1.6 ${SANS}`, color: "rgba(255,255,255,0.45)", maxWidth: "90ch" }}>Earth observation is decision support, not determination. Field verification is authoritative. BioCoda links to the Defra Biodiversity Metric; it does not recalculate it. Indicative pricing, not financial advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
