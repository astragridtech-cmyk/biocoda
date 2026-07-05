# Data retention schedule

How long BioCoda keeps each category of data, and why. Astragrid Technologies Ltd,
version 1.0, July 2026. Owner: misi@biocoda.uk.

Principle: we keep personal data only as long as there is a purpose or a legal
requirement, then delete or anonymise it.

| Data | Retention period | Rationale | Disposal |
| --- | --- | --- | --- |
| Website enquiry (name, email, organisation, role, message) | Duration of the enquiry, then up to 24 months | Follow up on demo/pilot conversations; short sales cycle in public sector | Deleted from inbox and Web3Forms |
| Account / licensed user record (name, email, organisation, role) | Life of the licence, then 30 days | Needed to provide the service; short grace period for reinstatement | Row deleted; auth account deleted |
| Authentication data (Supabase Auth) | Life of the account, then deleted with the account | Needed to sign the user in | Deleted with the account |
| Field verification records (assessment, notes, optional location, ecologist) | Life of the licence, plus any period the customer must retain evidence | This is the customer's compliance evidence for a 30-year obligation | Returned or deleted on the customer's instruction at end of contract |
| Essential session cookies | Session, or up to the token lifetime | Keep the user signed in securely | Expire automatically |
| Application and platform logs (request metadata, errors, internet protocol address) | Rolling, typically up to 30 days on the platform provider | Security monitoring and fault diagnosis | Rotated and overwritten by the provider |
| Backups (database) | Provider's backup window (Supabase point-in-time and daily backups) | Disaster recovery | Aged out on the provider's cycle |

## End of contract

On termination of a customer's licence, and at the customer's choice, we will
return or delete the personal data we hold on their behalf (account records and
field verifications), except where we are required by law to retain it. This is
also stated in the customer Data Processing Agreement.

## Notes

- The 30-year nature of the underlying Biodiversity Net Gain obligation means a
  customer may need the field-evidence records for a very long time. That
  retention is the customer's decision as controller; we hold the data for the
  life of the licence and hand it back on exit.
- Review this schedule annually.
