# Supabase setup

Everything here is ready. When you create the Supabase project, follow these steps in order.

## 1. Create the project

1. Go to https://supabase.com → New project
2. Name: `fundout` (or whatever you prefer)
3. Region: closest to you
4. Save the database password somewhere safe (you won't see it again)

## 2. Wire up env vars

In the Supabase dashboard, go to **Project Settings → API**. Grab:

- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
```

`.env` is gitignored — never commit it.

## 3. Apply migrations

Two options:

### Option A — Dashboard SQL editor (fastest for MVP)

Open the SQL editor in the Supabase dashboard and paste the content of each migration **in order**:

1. `migrations/0001_init_schema.sql`
2. `migrations/0002_seed_propfirms.sql`

### Option B — Supabase CLI (recommended once you're committing schema changes)

```bash
# Install once
brew install supabase/tap/supabase

# Link this project (one-time)
supabase login
supabase link --project-ref YOUR-PROJECT-ID

# Apply migrations
supabase db push
```

## 4. Generate TypeScript types

Once the schema is applied, regenerate `src/types/database.ts`:

```bash
# One-time install
brew install supabase/tap/supabase

# Generate types — replace YOUR-PROJECT-ID
supabase gen types typescript --project-id YOUR-PROJECT-ID --schema public > src/types/database.ts
```

A `pnpm types:gen` script is wired up. Set `SUPABASE_PROJECT_ID` in your shell first:

```bash
export SUPABASE_PROJECT_ID=YOUR-PROJECT-ID
pnpm types:gen
```

## 5. Configure auth (magic link)

In the Supabase dashboard:

1. **Authentication → Providers**: keep `Email` enabled, disable confirmations for dev if you want zero-friction login (turn it back on for prod).
2. **Authentication → URL Configuration**: add `http://localhost:5173` to site URL + redirect URLs.

That's it. Once these steps are done, the app will boot against your Supabase project.

## Schema overview

```
propfirms (global + per-user catalog)
  └── evaluations (purchased challenges)
        └── funded_accounts (1:1 when evaluation passes)
              └── payouts (N withdrawals per funded account)
```

All tables have RLS scoped to `auth.uid()`. The `propfirms` table allows reading globals (created_by IS NULL) plus your own custom entries.
