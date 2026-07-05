"use client";

import { useEffect, useState } from "react";

const SANS = "var(--font-inter), system-ui, sans-serif";
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;

const ROLES = [
  "Responsible body",
  "Local Planning Authority",
  "Developer",
  "Field ecologist",
  "Other",
];

/**
 * Book a demo or pilot. Submits to Web3Forms, which emails the enquiry to
 * misi@biocoda.uk. The access key is a public client key (safe to expose),
 * read from NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY. With no key set the form falls
 * back to a direct email link so the page never has a dead button.
 */
export function EnquiryForm() {
  const [enquiry, setEnquiry] = useState<"Demo" | "Pilot">("Demo");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preselect "Pilot" when arriving from a "Book a pilot" button (?enquiry=pilot).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("enquiry");
    if (q === "pilot") setEnquiry("Pilot");
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `BioCoda ${enquiry} request from ${data.name || "website"}`,
          from_name: "BioCoda website",
          ...data,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Submission failed.");
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const label: React.CSSProperties = { font: `600 13px ${SANS}`, color: "#18301A", display: "block", marginBottom: 6 };
  const field: React.CSSProperties = {
    width: "100%", font: `400 15px ${SANS}`, color: "#18301A", padding: "11px 13px",
    borderRadius: 10, border: "1.5px solid #B4BCA8", background: "#fff", boxSizing: "border-box",
  };

  if (!ACCESS_KEY) {
    return (
      <div style={{ font: `400 15px/1.6 ${SANS}`, color: "#5E5A50" }}>
        To arrange a demo or pilot, email{" "}
        <a href="mailto:misi@biocoda.uk?subject=BioCoda%20demo%20or%20pilot" style={{ color: "#245024", fontWeight: 600 }}>
          misi@biocoda.uk
        </a>{" "}
        and we will be in touch.
      </div>
    );
  }

  if (done) {
    return (
      <div role="status" style={{ background: "#E4EBDE", border: "1.5px solid rgba(59,125,60,0.4)", borderRadius: 12, padding: "22px 24px", font: `500 16px/1.6 ${SANS}`, color: "#245024" }}>
        Thank you. Your {enquiry.toLowerCase()} request is on its way to our team, and we will reply to
        the email you gave shortly.
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
      {/* Honeypot: hidden from people, catches bots. */}
      <input type="checkbox" name="botcheck" tabIndex={-1} style={{ display: "none" }} aria-hidden="true" />

      {/* Demo / Pilot toggle */}
      <div>
        <span id="ef-enquiry-label" style={label}>I would like to</span>
        <div role="radiogroup" aria-labelledby="ef-enquiry-label" style={{ display: "inline-flex", gap: 8 }}>
          {(["Demo", "Pilot"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={enquiry === opt}
              onClick={() => setEnquiry(opt)}
              style={{
                font: `600 14px ${SANS}`, padding: "9px 18px", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${enquiry === opt ? "#3B7D3C" : "#D7DDD2"}`,
                background: enquiry === opt ? "#3B7D3C" : "#fff",
                color: enquiry === opt ? "#fff" : "#5E5A50",
              }}
            >
              Book a {opt.toLowerCase()}
            </button>
          ))}
        </div>
        <input type="hidden" name="enquiry_type" value={enquiry} />
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }} className="lp-enquiry-grid">
        <div>
          <label style={label} htmlFor="ef-name">Full name</label>
          <input id="ef-name" name="name" required style={field} autoComplete="name" />
        </div>
        <div>
          <label style={label} htmlFor="ef-email">Work email</label>
          <input id="ef-email" name="email" type="email" required style={field} autoComplete="email" />
        </div>
        <div>
          <label style={label} htmlFor="ef-org">Organisation</label>
          <input id="ef-org" name="organisation" style={field} autoComplete="organization" />
        </div>
        <div>
          <label style={label} htmlFor="ef-role">Your role</label>
          <select id="ef-role" name="role" style={field} defaultValue="">
            <option value="" disabled>Select…</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={label} htmlFor="ef-msg">Anything about your sites or plans (optional)</label>
        <textarea id="ef-msg" name="message" rows={3} style={{ ...field, resize: "vertical" }} />
      </div>

      {error && (
        <div role="alert" style={{ background: "#F1EAF7", border: "1.5px solid rgba(142,91,181,0.4)", borderRadius: 10, padding: "10px 14px", font: `500 14px ${SANS}`, color: "#6b3f92" }}>
          {error} You can also email misi@biocoda.uk directly.
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        style={{
          justifySelf: "start", font: `600 16px ${SANS}`, color: "#fff", background: "#3B7D3C",
          padding: "14px 30px", borderRadius: 12, border: "none", cursor: "pointer",
          boxShadow: "0 12px 28px rgba(59,125,60,0.24)", opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Sending…" : `Book a ${enquiry.toLowerCase()}`}
      </button>
    </form>
  );
}
