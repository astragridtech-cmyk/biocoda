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
        possible. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA
        across the BioCoda website and application.
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
        <li>Interactive maps and satellite imagery are inherently visual and can be difficult to use with a screen reader. We provide the underlying figures in text and tables where we can.</li>
        <li>Some data visualisations, such as the 30-year condition trajectory, convey information graphically. We show the same values numerically alongside them and are working to make these fully accessible.</li>
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
        This statement was prepared in July 2026, based on our own review of the service against WCAG
        2.1 AA. We review it as the product develops.
      </p>
    </LegalPage>
  );
}
