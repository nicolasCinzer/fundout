# Supabase setup

Everything here is ready. When you create the Supabase project, follow these steps in order.

## 1. Create the project

1. Go to https://supabase.com → New project
2. Save the database password somewhere safe (you won't see it again)
3. Grab the project ref from the dashboard URL (`https://supabase.com/dashboard/project/<ref>`)

## 2. Wire up env vars

In the Supabase dashboard, go to **Project Settings → API**. Grab:

- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` (or `Publishable key`) → `VITE_SUPABASE_PUBLISHABLE_KEY`

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`.env` is gitignored — never commit it.

## 3. Apply migrations via the Supabase CLI

The CLI is installed as a project devDep. Authenticate once, link to your project, push the migrations:

```bash
# One-time auth (opens a browser)
pnpm exec supabase login

# Link this local project to your remote (replace YOUR-PROJECT-REF)
pnpm exec supabase link --project-ref YOUR-PROJECT-REF

# Apply pending migrations
pnpm db:push
```

Helpful scripts:

```bash
pnpm db:push           # apply all pending migrations
pnpm db:status         # show what's local vs remote
pnpm migration:new my-change   # scaffold a new migration file
```

### Already applied migrations? Mark them as such

If you already applied migrations through the dashboard SQL editor before adopting the CLI, the CLI's migration tracker doesn't know about them. Tell it they're applied without re-running them:

```bash
pnpm exec supabase migration repair --status applied <version>
```

Where `<version>` is the timestamp prefix of the migration file (e.g. `20260526100000`).

## 4. Generate TypeScript types

After every migration that changes schema, regenerate `src/types/database.ts`:

```bash
export SUPABASE_PROJECT_ID=YOUR-PROJECT-REF
pnpm types:gen
```

Tip: `export SUPABASE_PROJECT_ID=...` once in your `.zshrc` and forget about it.

## 5. Configure auth (magic link)

In the Supabase dashboard:

1. **Authentication → Providers**: keep `Email` enabled. For dev you can disable email confirmations to get zero-friction sign-in; re-enable for prod.
2. **Authentication → URL Configuration**: add `http://localhost:5173` to Site URL and Redirect URLs.

Once these steps are done, the app boots against your Supabase project.

## Schema overview

```
propfirms (global seed + per-user catalog)
  └── evaluations (purchased challenges, can accumulate resets)
        ├── evaluation_resets (events that add to the evaluation's total fee)
        └── funded_accounts (1:1 when evaluation passes)
              └── payouts (N withdrawals per funded account)
```

All tables have RLS scoped to `auth.uid()`. The `propfirms` table allows reading globals (`created_by IS NULL`) plus your own custom entries.
