import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Accessibility statement - BioCoda",
  description: "BioCoda's commitment to accessibility and how to report problems.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility statement" updated="July 2026">
      <p>
        Astragrid Technologies Ltd is committed to making BioCoda accessible to as many people as
        possible. We aim to meet the Web Content Accessibility Guidelines (WCAG) version 2.2 at level
        AA across the BioCoda website and application, and we have carried out a code-level self-audit
        against that standard.
      </p>

      <h2>What we do</h2>
      <ul>
        <li>Use semantic, structured markup so pages work with assistive technology.</li>
        <li>Support keyboard navigation and a visible focus order.</li>
        <li>Aim for sufficient colour contrast, and never rely on colour alone to convey status: on-track and at-risk are always labelled in words as well as colour.</li>
        <li>Provide text alternatives for meaningful images where practical.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>We are aware of areas we are still improving:</p>
      <ul>
        <li>Selecting a habitat parcel on the interactive map is currently done with a pointer. The same information, and the ability to open any parcel, is fully available from the keyboard-accessible data table and at-risk register.</li>
        <li>Panning the map requires a drag gesture (zoom has buttons); the data table is the non-spatial equivalent.</li>
        <li>Charts such as the 30-year condition trajectory convey information graphically. Each carries a text summary for assistive technology, and the same values are shown numerically alongside.</li>
      </ul>

      <h2>Reporting a problem</h2>
      <p>
        If you find something you cannot access, or you need information in a different format, please
        contact <a href="mailto:misi@biocoda.uk">misi@biocoda.uk</a>. Tell us the page and what went
        wrong, and we will aim to respond within five working days.
      </p>

      <h2>Enforcement</h2>
      <p>
        If you contact us with a complaint and are not happy with our response, you can contact the
        Equality and Human Rights Commission (EHRC), which is responsible for enforcing accessibility
        standards.
      </p>

      <h2>How this statement was prepared</h2>
      <p>
        This statement was prepared in July 2026, based on a code-level self-audit of the service
        against WCAG 2.2 AA. We review it as the product develops, and intend to commission an
        independent audit to confirm it.
      </p>
    </LegalPage>
  );
}
