# Record of Processing Activities (ROPA)

UK General Data Protection Regulation (UK GDPR) Article 30. This records the
personal data Astragrid Technologies Ltd processes through BioCoda.

- Controller: Astragrid Technologies Ltd, 86-90 Paul Street, London, EC2A 4NE.
- ICO registration: ZB992067.
- Contact: misi@biocoda.uk.
- Version 1.0, July 2026.

Astragrid acts as **controller** for website visitors and enquirers, and as
**processor** for the account and habitat data it holds on behalf of the
organisations that license BioCoda (see the customer Data Processing Agreement).

## 1. Enquirers (controller)

| Field | Detail |
| --- | --- |
| Purpose | Respond to demo and pilot enquiries; sales contact |
| Data subjects | People who submit the website enquiry form |
| Categories | Name, work email, organisation, role, free-text message |
| Special category data | None |
| Lawful basis | Legitimate interests (responding to an approach); pre-contract steps |
| Source | Provided directly by the person |
| Recipients | Web3Forms (form delivery), email inbox provider |
| Retention | Duration of the enquiry plus up to 24 months (see retention schedule) |
| Transfers | See sub-processor register |

## 2. Licensed users / account holders (processor for the customer)

| Field | Detail |
| --- | --- |
| Purpose | Provide access to BioCoda; authenticate users; attribute actions |
| Data subjects | Employees and agents of licensed organisations (responsible bodies, LPAs, developers, ecologists) |
| Categories | Name, email, organisation, role, authentication data, sign-in metadata |
| Special category data | None |
| Lawful basis | Controller (the customer) relies on its own basis; we process on instruction |
| Source | Provisioned by a customer administrator (invite-only) |
| Recipients | Supabase (authentication and database) |
| Retention | Life of the licence; deleted or anonymised after (see schedule) |
| Transfers | See sub-processor register |

## 3. Field verifications (processor for the customer)

| Field | Detail |
| --- | --- |
| Purpose | Record authoritative ground-truth condition assessments for habitat parcels |
| Data subjects | The ecologist who files the verification |
| Categories | Ecologist identity, assessment notes, timestamp, and, if the user chooses to share it, the device location captured at the time of the visit |
| Special category data | None (location is of a land parcel, provided by the user, not covert tracking) |
| Lawful basis | Customer's basis; we process on instruction |
| Source | Entered by the ecologist in the app |
| Recipients | Supabase (database) |
| Retention | Life of the licence plus any period the customer must retain evidence |
| Transfers | See sub-processor register |

## 4. Technical and security data (controller)

| Field | Detail |
| --- | --- |
| Purpose | Keep users signed in; keep the service secure and available; diagnose faults |
| Data subjects | All users |
| Categories | Essential session cookies, server and platform logs (request metadata, error traces, internet protocol address) |
| Special category data | None |
| Lawful basis | Legitimate interests (security and service integrity) |
| Retention | Rolling short-term logs (see schedule) |
| Recipients | Vercel (hosting/logs), Supabase (database logs) |

## Data not processed

- No payment card data is handled in the application.
- No special category data (health, biometrics, etc.) is collected.
- Earth observation imagery (Copernicus Sentinel-2) is of land and contains no
  personal data.

## Review

Reviewed at least annually, and whenever a new processing activity, data
category, or sub-processor is introduced.
