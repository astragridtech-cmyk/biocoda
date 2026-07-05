import Link from "next/link";
import { Logo } from "./Logo";

const SANS = "var(--font-inter), system-ui, sans-serif";
const SERIF = "var(--font-serif), Georgia, serif";

const LEGAL_LINKS: [string, string][] = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Accessibility statement", "/accessibility"],
];

/** Shared shell for the privacy / terms / accessibility pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid #DCE5D7", background: "#EFF3EC" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" aria-label="BioCoda home" style={{ display: "flex", textDecoration: "none" }}>
            <Logo />
          </Link>
          <Link href="/" style={{ font: `500 14px ${SANS}`, color: "#245024", textDecoration: "none" }}>
            &larr; Back to site
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: "56px 24px 72px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(30px,4vw,42px)", lineHeight: 1.1, letterSpacing: "-0.01em", color: "#18301A", margin: "0 0 8px" }}>
            {title}
          </h1>
          <p style={{ font: `400 14px ${SANS}`, color: "#7A7A70", margin: "0 0 32px" }}>Last updated: {updated}</p>
          <div className="legal-prose">{children}</div>
        </div>
      </main>

      <footer style={{ background: "#18301A", color: "rgba(255,255,255,0.7)", padding: "28px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ font: `400 13px ${SANS}` }}>BioCoda by Astragrid Technologies Ltd. &copy; 2026</span>
          <nav style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {LEGAL_LINKS.map(([label, href]) => (
              <Link key={href} href={href} style={{ font: `400 13px ${SANS}`, color: "rgba(255,255,255,0.78)", textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
