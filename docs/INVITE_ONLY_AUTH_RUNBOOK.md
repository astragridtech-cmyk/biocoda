# Invite-only auth and password reset: portable runbook

This is the exact pattern BioCoda uses, written so you can replay it for
FloodSense, PupilRoute, or any Next.js App Router app on Supabase. It gives you:

- No self-registration. A person can sign in only if an administrator has
  provisioned them. Sign-in works with Google, Microsoft, or email and password.
- Email and password users get a temporary password and are forced to set a new
  one at first login.
- A working "Forgot password" flow that lands on a real set-a-new-password page
  and then returns the user to sign in with the new password.

The whole thing rests on one rule: an authenticated identity is granted access
only if their email matches a row in an `app_user` table. That table is the gate,
and it also carries the organisation (tenant) and role, so those never come from a
cookie the user could tamper with.

House style for every user-facing string: no em-dashes, and spell out acronyms in
full (for example "Local Planning Authority", not "LPA").

---

## 1. The moving parts

| Piece | Job |
| --- | --- |
| Supabase Auth | The credential store: passwords and Google / Microsoft OAuth. |
| `app_user` table | The access gate. One row per licensed person, keyed by email, carrying tenant and role. |
| Provisioning script | Admin-only. Creates the Supabase auth user and the `app_user` row. Run from your machine, never shipped to the browser. |
| App auth gate | Server code that reads the Supabase session, looks up `app_user`, and denies anyone without a row. |
| `/auth/reset` page | Client page that receives the reset link, shows two password fields, saves the new password, and sends the user back to sign in. |

Three Supabase secrets, and where each is allowed to live:

- **Anon / publishable key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): browser-safe, used
  by the client.
- **Service / secret key** (`SUPABASE_SERVICE_KEY`): admin power. Used ONLY by the
  provisioning script on your machine. Never `NEXT_PUBLIC`, never in the app, never
  committed.
- **Database URL**: the provisioning script needs a role that can `INSERT` into
  `app_user` (use the `postgres` superuser connection). The running app uses a
  least-privilege role that has only `SELECT` on `app_user`.

---

## 2. Database: the `app_user` table

Create this once per project (adjust column names to match your schema). It must
be readable by the app's runtime role so the gate can look up an email, but the
app role should not be able to write to it.

```sql
create table if not exists app_user (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  tenant_id  text not null,
  role       text not null,
  created_at timestamptz not null default now()
);

-- The app connects as a least-privilege role. Read-only on the gate table.
grant select on app_user to <app_runtime_role>;
-- Do NOT grant insert/update/delete to the app role. Only the provisioning
-- script (postgres) writes here.
```

Note: `app_user` is intentionally NOT row-level-security scoped by tenant, because
the gate has to read it before it knows which tenant the user belongs to. Every
other tenant-scoped table stays behind row-level security as normal.

---

## 3. The provisioning script

One script does both halves of provisioning a person: it creates the Supabase auth
user (for password users, with a temporary password and a "must change" flag) and
it upserts the `app_user` row. See BioCoda's
`packages/db/src/provision-user.ts` for the reference implementation. The shape:

```
DATABASE_URL=<postgres superuser conn> \
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_KEY=<service key> \
  pnpm --filter @<project>/db provision \
    --email person@org.example \
    --name "Person Name" \
    --tenant <tenant-id> \
    --role <role> \
    --mode password        # or: sso
```

What it does:

- `--mode password`: calls `admin.auth.admin.createUser` with
  `email_confirm: true`, a generated temporary password (printed to your terminal
  once, hand it to the user over a secure channel), and
  `user_metadata: { must_change_password: true }`. Then upserts the `app_user` row.
- `--mode sso`: skips creating a password user (Google or Microsoft will create the
  auth user on first sign-in) and just upserts the `app_user` row, so the person is
  licensed the moment they use single sign-on.
- The `app_user` upsert uses `ON CONFLICT (email) DO UPDATE`, so re-running to fix
  a tenant or role is safe.

Adapt the two hard-coded bits per project: the workspace filter
(`@floodsense/db`, `@pupilroute/db`) and the role vocabulary.

---

## 4. The app auth gate (server)

Two functions, both async, both server-side. Reference:
`apps/web/lib/auth.ts` in BioCoda.

`getAuthState()`:

1. Read the Supabase session (email).
2. If no session, deny.
3. Look up `app_user` by email. If no row, the person is authenticated but not
   licensed: return `{ authenticated: true, provisioned: false }`. That is the
   invite-only denial.
4. Otherwise return tenant, role, name, and a `mustChangePassword` flag read from
   the Supabase user's `user_metadata.must_change_password`.

`getSession()`: calls `getAuthState()` and throws if the request is not a
provisioned user, so a tenant-scoped query can never fall through to some default
organisation's data.

The layout that wraps every signed-in page enforces the three redirects, in order:

```ts
const auth = await getAuthState();
if (!auth.authenticated)   redirect("/login");
if (!auth.provisioned)     redirect("/login?error=not_provisioned");
if (auth.mustChangePassword) redirect("/account/change-password");
```

The `error=not_provisioned` case is what a real, signed-in-but-unlicensed person
sees: a clear "ask your administrator" message on the login page rather than a
silent bounce.

---

## 5. First-login forced password change

For password users, `mustChangePassword` is true until they set their own. The
`/account/change-password` page has two fields and on submit calls:

```ts
await supabase.auth.updateUser({
  password: newPassword,
  data: { must_change_password: false },
});
// then send them to the dashboard
```

Clearing the metadata flag is what lets them past the layout redirect next time.

---

## 6. The forgot-password flow (the part that is easy to get wrong)

Two pieces: the request, and the landing page.

### 6a. Requesting the reset (on the login form)

```ts
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset`,
});
```

### 6b. The landing page MUST be a client page, not a route handler

This is the mistake to avoid. A server route handler only sees the query-code
(PKCE) form of the recovery link. Supabase sometimes delivers the token in the URL
hash instead, which a server cannot read, so those links silently fall through to
the dashboard. Make `/auth/reset` a client component that handles both forms.

Reference: `apps/web/app/auth/reset/page.tsx`. Its logic:

1. On mount, subscribe to `onAuthStateChange`; Supabase fires it once it has
   consumed a recovery token from the URL, at which point show the form.
2. Also handle the PKCE form explicitly: if there is a `?code`, call
   `exchangeCodeForSession(code)`.
3. As a fallback, after about 1.5 seconds call `getSession()`; if there is a
   session, show the form, otherwise show "this link is invalid or has expired".
4. The form has two fields, New password and Confirm. On submit:

```ts
await supabase.auth.updateUser({
  password: newPassword,
  data: { must_change_password: false },
});
await supabase.auth.signOut();
router.push("/login?reset=done");
```

5. The login page reads `?reset=done` and shows a green banner: "Your password has
   been updated. Please sign in with your new password."

Signing out after the update is deliberate: it forces a clean sign-in with the new
password rather than leaving them in a half-authenticated recovery session.

---

## 7. Supabase dashboard configuration (do this per project)

### 7a. Redirect allow-list

Authentication -> URL Configuration -> Redirect URLs. Add every callback the app
uses, using the production domain (and localhost for development):

```
https://<your-domain>/auth/callback
https://<your-domain>/auth/reset
https://<your-domain>/account/change-password
http://localhost:<port>/auth/callback
http://localhost:<port>/auth/reset
```

If `/auth/reset` is missing here, Supabase strips the redirect and the reset link
never reaches your page. This is the single most common failure.

### 7b. SMTP so reset and invite emails actually send

Authentication -> SMTP. Supabase's built-in email is rate-limited and not for
production, so point it at a real sender (BioCoda uses Brevo):

- Host: `smtp-relay.brevo.com`, port `587`.
- Username: your Brevo SMTP login. On Brevo this is NOT your account email; it is
  the SMTP login shown under Brevo -> SMTP and API -> SMTP (looks like
  `xxxxxxxx@smtp-brevo.com`).
- Password: a Brevo SMTP key generated on that same page. The `xkeysib-` REST API
  key does NOT work as an SMTP password; you need an SMTP key specifically.
- Sender / from address: an address on a domain you have verified in Brevo.

Two gotchas learned the hard way:

- Wrong SMTP username or an API key in the password field gives Supabase a 500
  "Error sending recovery email". If reset requests 500, this is why.
- Verify the sending domain in Brevo (the DKIM records), or mail lands in spam or
  is rejected.

### 7c. Providers

Authentication -> Providers. Enable Google and Azure (Microsoft). For each, in the
provider's own console register Supabase's callback
`https://<ref>.supabase.co/auth/v1/callback` as the authorized redirect, then paste
the client ID and secret into Supabase. For Microsoft, request `email openid
profile` scopes so the account email is populated (the `app_user` lookup needs it).

---

## 8. Environment variables

App runtime (Vercel, and `.env.local` for development):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
DATABASE_URL=<least-privilege app role, transaction pooler>
```

Provisioning only (your machine, never Vercel, never committed):

```
SUPABASE_SERVICE_KEY=<service / secret key>
DATABASE_URL=<postgres superuser conn, so it can INSERT app_user>
```

---

## 9. Test checklist (run this to confirm each project)

1. A signed-in but unlicensed email is bounced to `/login?error=not_provisioned`
   and sees the "ask your administrator" message.
2. Provision a password user. The temporary password is printed. First login
   forces the change-password page; after changing, the dashboard loads.
3. Provision an SSO-only user. Google or Microsoft sign-in works with no password
   step.
4. Forgot password: request a reset, receive the email, click the link, land on
   `/auth/reset` (not the dashboard), set the password twice, get returned to login
   with the green banner, and sign in with the new password.
5. Trigger a reset by API to confirm SMTP, without touching the UI:

```
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -X POST "https://<ref>.supabase.co/auth/v1/recover" \
  -H "apikey: <anon key>" -H "Content-Type: application/json" \
  -d '{"email":"someone@org.example"}'
```

HTTP 200 means Supabase accepted it and handed it to SMTP. A 500 means SMTP is
misconfigured (see 7b).

---

## 10. Porting checklist for FloodSense and PupilRoute

Per project, in order:

- [ ] Create the `app_user` table; grant the app role `SELECT` only.
- [ ] Copy the provisioning script; change the workspace filter and role list.
- [ ] Copy `lib/auth.ts` (`getAuthState` / `getSession`) and the layout redirects.
- [ ] Copy the `/account/change-password` page.
- [ ] Copy the `/auth/reset` CLIENT page and wire "Forgot password" on the login
      form to `resetPasswordForEmail(..., { redirectTo: origin + "/auth/reset" })`.
- [ ] Login page: handle `?reset=done` (green banner) and
      `?error=not_provisioned`.
- [ ] Supabase dashboard: redirect allow-list (include `/auth/reset`), SMTP,
      providers.
- [ ] Set the three runtime env vars in Vercel; keep the service key local.
- [ ] Provision yourself, then walk the section 9 checklist.

PupilRoute note: it already uses this invite-only model (the `app_user` gate and
Supabase SMTP via Resend for reset emails). The new part to bring over there is the
client `/auth/reset` page, so its reset link stops dropping into the dashboard.
```
