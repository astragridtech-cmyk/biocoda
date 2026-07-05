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

## Security certification and testing

- [ ] Obtain **Cyber Essentials** (a strong, low-cost baseline that public-sector
      buyers frequently ask for). Consider Cyber Essentials Plus next.
- [ ] Commission an independent **penetration test** and remediate findings.
- [ ] Consider **ISO 27001** only if larger customers require it (significant effort).

## Operational assurance

- [ ] Run and document a **backup restore test** on the database.
- [ ] Set an **access review** cadence (for example quarterly) to confirm the user
      and admin lists are still correct.
- [ ] Document a basic business continuity / disaster recovery plan.

## Accessibility

- [x] Publish an accessibility statement targeting WCAG 2.1 AA.
- [ ] Commission an independent accessibility audit to replace the current
      self-assessment, and address the known limitations (maps, trajectory chart).

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
2. Cyber Essentials (fast, cheap, most-requested certificate).
3. Legal sign-off of the policies and DPA.
4. Penetration test and insurance.
5. ISO 27001 only if a deal requires it.
