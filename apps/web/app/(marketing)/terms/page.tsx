import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of use - BioCoda",
  description: "The terms on which you may use BioCoda.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" updated="July 2026">
      <p>
        These terms govern your use of the BioCoda website and application, provided by{" "}
        <strong>Astragrid Technologies Ltd</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;), 86-90 Paul
        Street, London, EC2A 4NE. By using BioCoda you agree to these terms. If you do not agree,
        please do not use the service.
      </p>

      <h2>The service</h2>
      <p>
        BioCoda monitors the condition of Biodiversity Net Gain habitat parcels using Earth
        observation and field verification, and helps organisations evidence their long-term
        obligations. BioCoda links to the Defra Biodiversity Metric; it does not recalculate it.
      </p>

      <h2>Nature of the information</h2>
      <p>
        Earth observation outputs are <strong>decision support</strong>, not a determination. Field
        verification by a competent ecologist is authoritative. BioCoda&rsquo;s outputs are provided
        to support monitoring and evidence, and do not constitute legal, planning, ecological, or
        financial advice. You remain responsible for decisions you take and for meeting your own
        regulatory obligations.
      </p>

      <h2>Access and acceptable use</h2>
      <ul>
        <li>Access is invite-only and licensed to your organisation. Keep your credentials secure and do not share your account.</li>
        <li>Use BioCoda only for its intended purpose and in accordance with applicable law.</li>
        <li>Do not attempt to gain unauthorised access, disrupt the service, or interfere with its security or other users.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        BioCoda, its software, design, and content are owned by Astragrid Technologies Ltd or our
        licensors. Licensed users are granted a limited, non-exclusive, non-transferable right to use
        the service for the term of their licence. Third-party imagery and data are used under their
        respective licences.
      </p>

      <h2>Availability</h2>
      <p>
        The service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We
        work to keep it reliable but do not guarantee uninterrupted or error-free operation.
      </p>

      <h2>Liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for indirect or consequential loss,
        or for loss arising from reliance on outputs that should have been confirmed by field
        verification or professional judgement. Nothing in these terms excludes or limits liability
        that cannot be excluded by law, including for death or personal injury caused by negligence,
        or for fraud.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the law of England and Wales, and the courts of England and Wales
        have exclusive jurisdiction.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms from time to time; the date above shows when they last changed. For
        any question, contact <a href="mailto:misi@biocoda.uk">misi@biocoda.uk</a>.
      </p>
    </LegalPage>
  );
}
