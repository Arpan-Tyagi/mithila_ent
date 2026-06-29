# Go-live: database + admin login

All code env vars are set. These are the only remaining steps, done in the
Supabase dashboard (https://supabase.com/dashboard → your project `nhmarliyovmucuqryceg`).

## Step 1 — Check what's already applied
Open **SQL Editor → New query**, paste **`00_CHECK_STATE.sql`**, click **Run**.
Read the true/false row:

- **All false** → fresh DB → run **`01_FULL_SETUP_fresh_db.sql`** (whole file, Run).
- **profiles/products true, but pending_emails / image_bucket false** → app already
  installed, just missing the new work → run **`02_NEW_MIGRATIONS_only.sql`**.
- **All true** → already set up → skip to Step 3.

## Step 2 — Apply the chosen bundle
Paste the file from Step 1 into a new SQL Editor query and **Run**. It's safe to
re-run (idempotent for the new migrations).

## Step 3 — Create your owner account (admin login)
**Authentication → Users → Add user**:
- Email: `arpantyagi88@gmail.com`
- Password: (choose a strong one)
- Tick **Auto Confirm User** ✅

Migration `0023` automatically gives this email the `admin` role (on creation via
the trigger, and via its promote step if the account already existed). Order
doesn't matter — Step 2 and Step 3 can be done in either order.

## Step 4 — Sign in
Go to your site `/login` (or `/admin/login`) → you land on `/admin/dashboard`.

## After launch
- Rotate the Supabase **service_role** key and the Resend key (both were shared in
  chat) — Supabase: Project Settings → API → Roll; Resend: API Keys → recreate.
  Update `.env.local` and your Vercel env afterward.
- On Vercel, add every var from `.env.local` under Project → Settings → Environment Variables.
