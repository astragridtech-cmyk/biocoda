# Compliance readiness checklist

The actions that need external effort, money, or a signature, which documents
alone cannot complete. Astragrid Technologies Ltd, BioCoda. Version 1.0, July 2026.
Owner: misi@biocoda.uk.

Status key: [ ] to do, [~] in progress, [x] done.

## Data protection

- [x] Register with the ICO (registration ZB992067).
- [x] Publish privacy policy, terms, and accessibility statement.
- [x] Record of Processing Activities, retention schedule, DPIA, breach procedure (this pack).
- [ ] Appoint a named data protection lead (a statutory Data Protection Officer is
      likely not required at current scale, but assign the responsibility and
      record who holds it).
- [ ] Add the company registration number to the privacy and terms pages.
- [ ] Legal review and sign-off of the privacy policy, terms, customer DPA, and this pack.
- [ ] Put staff/contractor confidentiality undertakings in place.

## Sub-processor agreements

- [ ] Accept and file the Supabase Data Processing Agreement.
- [ ] Accept and file the Vercel Data Processing Agreement.
- [ ] Accept and file the Brevo Data Processing Agreement.
- [ ] Accept and file the Cloudflare Data Processing Agreement.
- [ ] Confirm Web3Forms terms and data handling are acceptable, or move the
      enquiry form to a first-party endpoint.

## Data residency

- [ ] Pin Vercel serverless function execution to a UK region (London, `lhr1`) and
      confirm the current region, to match the database's UK residency.

## Security certification

- [x] **Cyber Essentials** certified across the whole organisation (certificate
      18afe630-9161-49f6-999e-e0f287b70f27, certified 3 December 2025,
      recertification due 3 December 2026, assessed by IASME).
- [ ] Renew Cyber Essentials before 3 December 2026.
- [ ] Consider **Cyber Essentials Plus** (hands-on audited version) if larger
      buyers ask for it.
- [ ] Consider **ISO 27001** only if larger customers require it (significant effort).

## Operational assurance

- [ ] Run and document a **backup restore test** on the database.
- [ ] Set an **access review** cadence (for example quarterly) to confirm the user
      and admin lists are still correct.
- [ ] Document a basic business continuity / disaster recovery plan.

## Accessibility

- [x] Publish an accessibility statement targeting WCAG 2.2 AA.
- [x] Complete a code-level WCAG 2.2 AA self-audit and fix the clear issues
      (see accessibility-audit.md).
- [ ] Address the outstanding limitations: map keyboard selection and pan
      alternative, drawer focus trap, and live announcement of dashboard changes.
- [ ] Commission an independent accessibility audit (with assistive-technology
      testing) to confirm the self-assessment.

## Insurance

- [ ] Put **professional indemnity** and **cyber** insurance in place; buyers often
      ask for evidence of cover.

## Sales enablement

- [x] Security overview and customer DPA ready to send.
- [x] Biodiversity Net Gain regulatory positioning note (keeps claims defensible).
- [ ] Prepare a short, reusable answer set for bespoke security questionnaires.

## Priority order (suggested)

1. Sub-processor DPAs on file and Vercel region pinned (fast, free, closes the
   residency gap).
2. Legal sign-off of the policies and DPA.
3. Professional indemnity and cyber insurance.
4. Renew Cyber Essentials before it lapses (December 2026).
5. ISO 27001 only if a deal requires it.
