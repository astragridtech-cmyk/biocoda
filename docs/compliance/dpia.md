# Data Protection Impact Assessment (DPIA)

Astragrid Technologies Ltd, BioCoda. Version 1.0, July 2026. Owner: misi@biocoda.uk.

A DPIA screening decides whether a full assessment is required, and if so records
it. This document does both.

## Part A: screening

Does BioCoda involve any of the ICO's high-risk triggers?

| Trigger | Present? | Note |
| --- | --- | --- |
| Systematic and extensive profiling with legal/significant effects | No | BioCoda assesses land condition, not people. No decisions are made about individuals. |
| Large-scale processing of special category or criminal data | No | No special category data is processed. |
| Systematic monitoring of a publicly accessible area | No | Earth observation is of land parcels under a Biodiversity Net Gain agreement, not surveillance of people. |
| Innovative technology used on personal data | Partially | Earth observation and satellite analytics are innovative, but applied to land, not to personal data. |
| Denial of a service or contract based on automated decision | No | No automated decisions about individuals. |
| Tracking individuals' location | Low | An ecologist may optionally share their device location when they file a verification. It is user-initiated, tied to a work task, and not covert tracking. |

**Conclusion:** BioCoda does not meet the threshold that makes a DPIA mandatory,
because it does not process special category data or make significant automated
decisions about individuals, and its core analytics are of land rather than
people. A DPIA is nonetheless completed below as good practice, because the
service is B2B/B2G, invite-only, and holds the optional location of field staff.

## Part B: assessment

### Nature, scope, context, and purpose

BioCoda monitors Biodiversity Net Gain habitat condition from Earth observation
and field verification. Personal data is limited to: enquirers, licensed users
(name, email, organisation, role), and field verifications (ecologist identity,
notes, optional device location). Data subjects are professional users acting in
a work capacity, not consumers or vulnerable groups.

### Necessity and proportionality

- Data collected is the minimum needed to provide access, attribute actions, and
  record authoritative field evidence.
- Access is invite-only and least-privilege; users see only their organisation's
  data, enforced in the database by Row-Level Security.
- Location is optional, user-initiated, and relates to a work site.

### Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Unauthorised access to another tenant's data | Low | High | Row-Level Security enforced in the database; app connects as a least-privilege role that cannot bypass it; invite-only gate |
| Account compromise | Low | Medium | Single sign-on options; forced password change on first login; password reset flow; no shared accounts |
| Excessive retention of field-staff location | Low | Low | Location is optional; retention schedule; deletion on exit |
| Sub-processor transfer outside the UK | Low | Low | Reputable providers with DPAs and standard contractual clauses; primary datastore in the UK |
| Data loss | Low | Medium | Managed database with backups and point-in-time recovery |

### Residual risk

Low. No high residual risks that would require prior consultation with the ICO.

### Sign-off

To be reviewed and signed by the Astragrid data protection lead, and revisited if
processing materially changes.
