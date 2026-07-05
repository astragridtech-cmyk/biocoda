# BioCoda compliance pack

This folder is the evidence pack for BioCoda's data protection, security, and
regulatory position. It exists to answer, with documents, what customers (in
particular Local Planning Authorities and responsible bodies) and regulators ask
before they trust a supplier.

Controller / supplier: **Astragrid Technologies Ltd**, 86-90 Paul Street, London,
EC2A 4NE. Information Commissioner's Office registration **ZB992067**. Privacy and
security contact: **misi@biocoda.uk**.

House style: no em-dashes; acronyms defined on first use.

> These documents are drafted to reflect how BioCoda actually works and are a
> strong starting position, but they are not a substitute for sign-off by a
> qualified data protection or legal adviser before you rely on them in a
> contract or tender.

## What's here

| Document | Purpose | Audience |
| --- | --- | --- |
| [ROPA.md](ROPA.md) | Record of Processing Activities (UK GDPR Article 30) | Internal / ICO |
| [retention-schedule.md](retention-schedule.md) | How long each data set is kept and why | Internal / customers |
| [dpia.md](dpia.md) | Data Protection Impact Assessment screening and assessment | Internal / ICO |
| [subprocessor-register.md](subprocessor-register.md) | Every third party that processes data, and safeguards | Internal / customers |
| [data-breach-procedure.md](data-breach-procedure.md) | How we detect, contain, and report a breach | Internal |
| [customer-DPA.md](customer-DPA.md) | Data Processing Agreement to offer customers (we act as processor) | Customers |
| [security-overview.md](security-overview.md) | Security white paper and answers to standard due-diligence questions | Customers |
| [bng-regulatory-positioning.md](bng-regulatory-positioning.md) | Environment Act 2021 / statutory metric boundaries and defensible claims | Sales / internal |
| [accessibility-audit.md](accessibility-audit.md) | WCAG 2.2 AA self-audit: findings, fixes, and outstanding items | Internal / customers |
| [readiness-checklist.md](readiness-checklist.md) | External actions still needed (certification, pen test, insurance, signatures) | Internal |

The public-facing summary of all this lives on the website at `/trust`.

## Current posture (the good news customers care about)

- **Tenant isolation** enforced in the database by Row-Level Security, with the
  application connecting as a least-privilege role that cannot bypass it.
- **Invite-only access**: no self-registration; a sign-in is only granted if the
  email maps to a licensed user record, which also fixes the organisation and
  role.
- **UK data residency** for the primary datastore (Supabase, London region).
- **Encryption** in transit (Transport Layer Security) and at rest.
- **Least data**: BioCoda's core signal is Earth observation of land, which
  contains no personal data.
- **Cyber Essentials certified** across the whole organisation (certified
  3 December 2025, recertification due 3 December 2026).

## The honest gaps (tracked in the readiness checklist)

- Sub-processor Data Processing Agreements need to be executed and filed.
- Application-layer hosting (Vercel functions) should be pinned to a UK region to
  match the database's residency.
- Legal sign-off of the policies and customer DPA is still to be arranged.
