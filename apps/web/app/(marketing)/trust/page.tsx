import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Trust and security - BioCoda",
  description: "How BioCoda protects your data: hosting, isolation, encryption, and compliance.",
};

export default function TrustPage() {
  return (
    <LegalPage title="Trust and security" updated="July 2026">
      <p>
        BioCoda holds evidence that organisations rely on for a 30-year obligation, so it is built to
        be trustworthy from the ground up. This page summarises how we protect your data. For the
        full security overview or a Data Processing Agreement, contact{" "}
        <a href="mailto:misi@biocoda.uk">misi@biocoda.uk</a>.
      </p>

      <h2>Where your data lives</h2>
      <p>
        Our primary datastore is a managed PostgreSQL database in the{" "}
        <strong>United Kingdom (London)</strong>. Data is encrypted in transit (Transport Layer
        Security) and at rest, and the database is backed up with point-in-time recovery.
      </p>

      <h2>Separation between organisations</h2>
      <p>
        Every organisation's data is isolated in the database by <strong>Row-Level Security</strong>.
        The application connects with a least-privilege role that cannot bypass that isolation, so one
        organisation can never see another's data, even in the unlikely event of an application fault.
      </p>

      <h2>Who can get in</h2>
      <ul>
        <li><strong>Invite-only.</strong> There is no self-registration. Access is granted only to people an administrator has provisioned, and their organisation and role are fixed to their account.</li>
        <li><strong>Single sign-on</strong> with Google and Microsoft, as well as email and password.</li>
        <li>Password users must <strong>set a new password at first login</strong>, and can reset it themselves.</li>
        <li>Administrative keys are held server-side only and never exposed to the browser.</li>
      </ul>

      <h2>Our providers</h2>
      <p>
        We keep our supply chain small and reputable: Supabase (UK-hosted database and sign-in),
        Vercel (application hosting), Brevo (transactional email), Cloudflare (domain), and Web3Forms
        (enquiry form). Each operates under a Data Processing Agreement with appropriate transfer
        safeguards. A full sub-processor list is available on request.
      </p>

      <h2>Data protection</h2>
      <p>
        BioCoda is provided by Astragrid Technologies Ltd, registered with the Information
        Commissioner's Office (registration <strong>ZB992067</strong>). We process the minimum
        personal data needed to run the service, and never sell it. Read our{" "}
        <Link href="/privacy">privacy policy</Link> for the detail, and our{" "}
        <Link href="/terms">terms of use</Link> and{" "}
        <Link href="/accessibility">accessibility statement</Link>.
      </p>

      <h2>Responsible disclosure</h2>
      <p>
        If you believe you have found a security issue, please tell us at{" "}
        <a href="mailto:misi@biocoda.uk">misi@biocoda.uk</a> so we can address it. We appreciate
        reports made in good faith and will work with you on a fix.
      </p>

      <h2>What we are improving</h2>
      <p>
        We are candid about maturity. We are working towards independent certification (Cyber
        Essentials) and an external penetration test, and we pin our hosting to the United Kingdom as
        we go. We are happy to discuss our roadmap with your security team.
      </p>
    </LegalPage>
  );
}
