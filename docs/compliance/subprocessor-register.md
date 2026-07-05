# Sub-processor register

The third parties that process personal data on BioCoda's behalf, what they do,
where, and the safeguards in place. Astragrid Technologies Ltd, version 1.0,
July 2026. Owner: misi@biocoda.uk.

We keep the number of sub-processors small and use reputable providers who offer a
Data Processing Agreement (DPA) and appropriate transfer safeguards. Customers are
notified before a new sub-processor that touches their data is added.

| Sub-processor | Service | Data processed | Location | Safeguard |
| --- | --- | --- | --- | --- |
| Supabase | Managed Postgres database and authentication | Account records, field verifications, auth data | London (UK region) | Provider DPA; UK/EU hosting; encryption at rest |
| Vercel | Application hosting and serving | Data in transit through the app; platform logs | See note below | Provider DPA; standard contractual clauses for any transfer |
| Brevo (Sendinblue) | Transactional email (invites, password resets) | Recipient name and email | EU (France) | Provider DPA; UK/EU adequacy |
| Web3Forms | Delivery of website enquiry submissions | Enquiry form fields | Provider infrastructure | Provider terms; minimal data; no special category data |
| Cloudflare | DNS and domain redirect for biocoda.uk | Request metadata (internet protocol address) in transit | Global edge | Provider DPA; standard contractual clauses |

## Transfer note

The primary datastore (Supabase) is in the United Kingdom. Some providers,
notably Vercel's serverless functions and Cloudflare's edge, may process data
transiently outside the UK. Where that happens we rely on a UK adequacy decision
or standard contractual clauses in the provider's DPA.

Action tracked in the readiness checklist: pin Vercel function execution to a UK
region (London, `lhr1`) to bring the application layer in line with the database's
residency, and confirm which region currently applies.

## Adding or changing a sub-processor

1. Confirm the provider offers a DPA and adequate transfer safeguards.
2. Record it in this register.
3. Notify affected customers in line with the customer DPA before the change takes
   effect for their data.

## DPA status

Executed provider DPAs are tracked in the readiness checklist. Standard provider
DPAs are available from each provider and should be accepted/countersigned and
filed.
