# BioCoda security overview

For customer security and procurement teams. Astragrid Technologies Ltd, version
1.0, July 2026. Contact: misi@biocoda.uk.

This document summarises how BioCoda is built and operated securely, and answers
the questions that appear on most supplier security questionnaires.

## Architecture

- **Application:** a single web application (Next.js) served over HTTPS. There is
  no separate mobile app; field staff use the same responsive web app on any
  device.
- **Database:** managed PostgreSQL (Supabase) in the United Kingdom (London
  region), with PostGIS for spatial data.
- **Authentication:** Supabase Auth, supporting single sign-on with Google and
  Microsoft, and email/password.
- **Earth observation:** Copernicus Sentinel-2 imagery, which is land data and
  contains no personal data.

## Access control and tenant isolation

- **Tenant isolation is enforced in the database** by Row-Level Security. The
  application connects as a least-privilege role that does not have permission to
  bypass Row-Level Security, so one organisation cannot read another's data even
  if application code were faulty.
- **Invite-only access.** There is no self-registration. A sign-in is granted only
  if the authenticated email maps to a licensed user record, which also fixes the
  user's organisation and role. The organisation and role come from that record,
  never from a cookie the user could tamper with.
- **Least privilege.** Roles (responsible body, Local Planning Authority,
  developer, ecologist, administrator) scope what a user can see and do.
- **Administration.** User provisioning and revocation is done by an administrator
  from within the app, gated to an explicit admin allowlist.

## Authentication and credentials

- Single sign-on (Google, Microsoft) and email/password.
- Password users receive a one-time temporary password and are **forced to set a
  new password at first login**.
- A self-service password reset flow is available.
- Administrative service keys are held server-side only and are never exposed to
  the browser.

## Encryption

- **In transit:** all traffic is over Transport Layer Security (HTTPS).
- **At rest:** database and backups are encrypted by the managed database
  provider.

## Data residency

- The primary datastore (Supabase) is in the **United Kingdom** (London).
- Some providers (application hosting, edge/DNS) may process data transiently
  outside the UK under standard contractual clauses. Pinning application function
  execution to a UK region is a tracked action (see readiness checklist).

## Logging and monitoring

- Platform and application logs capture request metadata and errors for security
  monitoring and fault diagnosis, retained short-term.
- Authentication events are handled by the managed auth provider.

## Backups and recovery

- The managed database provides automated daily backups and point-in-time
  recovery within the provider's retention window.

## Secure development

- Version-controlled codebase with typed code and an automated test suite.
- Changes are built and type-checked before deployment; deployments are automated
  from the main branch.
- Secrets are stored as environment variables in the hosting platform, not in the
  code repository.
- Dependencies are managed with a lockfile.

## Vulnerability and patch management

- Runtime and dependencies are kept current; the managed platform and database
  providers patch the underlying infrastructure.
- An independent penetration test is a tracked action (see readiness checklist).

## Sub-processors

See the sub-processor register. All hold Data Processing Agreements and appropriate
transfer safeguards.

## Incident response

- A documented personal data breach procedure is in place, including the UK GDPR
  72-hour reporting duty and customer notification.

## Business continuity

- Serverless hosting and a managed database reduce single points of failure.
- Backups and point-in-time recovery support restoration.

## Common questionnaire answers (quick reference)

| Question | Answer |
| --- | --- |
| Where is data hosted? | United Kingdom (London) for the primary datastore |
| Is data encrypted in transit and at rest? | Yes |
| Is there multi-tenant isolation? | Yes, enforced by database Row-Level Security |
| Is there self-registration? | No, invite-only |
| Single sign-on supported? | Yes, Google and Microsoft |
| Are passwords forced to change on first login? | Yes |
| Do you process special category data? | No |
| Do you have a breach process and ICO reporting? | Yes |
| Do you have a customer DPA? | Yes |
| Independent certification (Cyber Essentials / ISO 27001)? | Not yet, see readiness checklist |
| Penetration test on record? | Not yet, see readiness checklist |

We answer bespoke security questionnaires on request.
