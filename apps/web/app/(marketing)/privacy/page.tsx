import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy - BioCoda",
  description: "How BioCoda and Astragrid Technologies Ltd handle your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="July 2026">
      <p>
        This policy explains how we collect and use personal data when you use the BioCoda website
        and application, or contact us. BioCoda is a service provided by{" "}
        <strong>Astragrid Technologies Ltd</strong>, the data controller responsible for your
        personal data.
      </p>

      <h2>Who we are</h2>
      <p>
        Astragrid Technologies Ltd, 86-90 Paul Street, London, EC2A 4NE, United Kingdom. We are
        registered with the Information Commissioner&rsquo;s Office (registration number{" "}
        <strong>ZB992067</strong>). For any question about this policy or your data, contact us at{" "}
        <a href="mailto:misi@biocoda.uk">misi@biocoda.uk</a>.
      </p>

      <h2>The data we collect</h2>
      <ul>
        <li>
          <strong>Enquiries.</strong> When you use the &ldquo;book a demo or pilot&rdquo; form we
          collect your name, work email, organisation, role, and any message you send.
        </li>
        <li>
          <strong>Account holders.</strong> For licensed users we hold your name, email,
          organisation, and role, together with authentication data needed to sign you in. Where an
          ecologist records a field verification, we store the condition assessment, notes, and, if
          you choose to share it, the device location captured at the time.
        </li>
        <li>
          <strong>Technical data.</strong> Essential cookies that keep you signed in, and standard
          server logs (such as request times and error information) used to keep the service secure
          and working.
        </li>
      </ul>
      <p>
        Earth observation imagery used by BioCoda (for example Copernicus Sentinel-2 data) relates
        to land, not people, and does not contain your personal data.
      </p>

      <h2>Why we use it, and our legal basis</h2>
      <ul>
        <li>
          <strong>Responding to your enquiry</strong> and taking steps at your request before any
          agreement. Legal basis: our legitimate interests and, where relevant, steps prior to a
          contract.
        </li>
        <li>
          <strong>Providing the service</strong> to your organisation. Legal basis: performance of a
          contract with the organisation that licenses BioCoda.
        </li>
        <li>
          <strong>Keeping the service secure and reliable.</strong> Legal basis: our legitimate
          interests in protecting the service and its users.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use only essential cookies needed to sign you in and keep your session secure. We do not
        use advertising or third-party tracking cookies.
      </p>

      <h2>Who we share it with</h2>
      <p>
        We use a small number of trusted providers to run the service, who process data on our
        instructions:
      </p>
      <ul>
        <li>Vercel, for website and application hosting.</li>
        <li>Supabase, for the database and sign-in (authentication).</li>
        <li>Brevo, for sending transactional email such as invites and password resets.</li>
        <li>Web3Forms, for delivering enquiry-form submissions to us.</li>
      </ul>
      <p>
        We do not sell your personal data. We may disclose data where required by law or to protect
        our legal rights.
      </p>

      <h2>International transfers</h2>
      <p>
        Some of our providers may process data outside the United Kingdom. Where they do, we rely on
        appropriate safeguards, such as a UK adequacy decision or standard contractual clauses, so
        your data remains protected.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep enquiry data for as long as needed to deal with your enquiry and for a reasonable
        period afterwards. Account data is kept for the life of the licence and for any period we are
        required to retain it by law, after which it is deleted or anonymised.
      </p>

      <h2>Your rights</h2>
      <p>
        You have the right to access your personal data and to ask us to correct, erase, or restrict
        it, to object to processing, and to data portability. To exercise any of these, email{" "}
        <a href="mailto:misi@biocoda.uk">misi@biocoda.uk</a>. You also have the right to complain to
        the Information Commissioner&rsquo;s Office at{" "}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>, though
        we would welcome the chance to resolve any concern first.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The date above shows when it was last changed.
      </p>
    </LegalPage>
  );
}
