# Fundout

> A propfirm tracker for traders who want to know if the grind is actually paying off.

Unlike trade journals (Tradezella, Edgewonk), Fundout tracks the **meta-game** of propfirms: how much you've spent on evaluations, how many got funded, how many of those paid out, and the net P&L across the whole journey. It answers the question every prop trader eventually asks: **am I actually making money playing this game?**

## Stack

- **Build**: Vite 8, React 19, TypeScript 6
- **Styling**: Tailwind v4, [shadcn/ui](https://ui.shadcn.com) (new-york style)
- **Routing**: TanStack Router (file-based, code-split per route)
- **Data**: TanStack Query against Supabase (Postgres + Row-Level Security + Magic-link auth)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts via shadcn chart primitives
- **Deploy**: TBD (Vercel + Supabase Cloud planned)

## What works today

- **Auth** via Supabase magic link (passwordless, one-click sign in)
- **CRUD-create + state transitions** across three entities: evaluations → funded accounts → payouts
- **One-click "Mark as funded"** runs a compound mutation: closes the evaluation and creates the funded account atomically from a user perspective
- **Dashboard** with the six KPIs that matter: net P&L, total spent, total payouts, funding ratio, payout ratio, active funded count — plus a monthly fees-vs-payouts chart and a funding funnel
- **URL-state filters, search and sortable columns** on every table (bookmarkeable, shareable, survives refresh)
- **Dark mode** with FOUC-prevention inline script
- **Skeleton + contextual empty-state UX** across all data fetching (different empty messages when filters are active vs. truly empty)

## Architecture highlights

These are the decisions that don't show up on a screenshot but make the codebase actually pleasant to work in.

### Screaming Architecture

`src/features/{evaluations,funded-accounts,payouts,dashboard,auth,propfirms}` over layer-first organization. A new contributor opens `src/features/` and understands what the product does in five seconds — the domain shouts louder than the framework. Each feature is autonomous: components, hooks, schemas, queries. Delete a feature folder and the rest keeps working.

### Schema-enforced invariants

Business rules live in the database, not in JavaScript:

- `funded_accounts.evaluation_id UNIQUE` enforces the 1:1 relationship between a passed evaluation and a funded account
- `numeric(12,2)` for all monetary columns (never `float`/`real` — binary precision will bite you with `0.1 + 0.2 = 0.30000000000000004`)
- `CHECK` constraints enforce coherence (`status = 'in_progress' ↔ closed_at IS NULL`)
- `ON DELETE CASCADE` for owned data, `ON DELETE RESTRICT` for references (you can't delete a propfirm if evaluations point to it)

### RLS as the security boundary

Every table has Row-Level Security scoped to `auth.uid()`. The client can ask for anything; the database returns only what belongs to the user. RLS uses `(select auth.uid())` (subquery) instead of `auth.uid()` directly — Supabase 2025 best practice that lets Postgres cache the call as an `InitPlan` instead of re-evaluating per row.

### URL state for table interactions

Filters, search query, and sort live in the URL search params via TanStack Router's `validateSearch`. The Zod schema uses `.catch(undefined)` per field to gracefully degrade when someone pastes a malformed URL — no error boundary, just ignore the bad param. `navigate({ ..., replace: true })` avoids polluting history with every keystroke.

### Defensive enum lookups

When migrating an enum value out of a column, regenerated types may lag behind code for a moment. The pattern `Partial<Record<EnumType, T>>` with a `?? fallback` lookup means the code compiles regardless of whether the type is the old or new shape. Useful any time you're rolling out a schema change.

### Compound mutations for UX flows

"Mark as funded" is one click from the user's perspective but two operations under the hood: `UPDATE evaluations SET status='passed'` plus `INSERT INTO funded_accounts`. Not atomic at the DB level (would require an RPC function), but idempotent — if step 2 fails, retry is safe because `UPDATE` is a no-op the second time and `INSERT` respects the `UNIQUE` constraint.

### Compute is a pure function, not a hook

Dashboard KPIs and monthly aggregations are pure functions in `features/dashboard/lib/` that take data and return derived values. The route orchestrates the queries and calls compute. Components are tonto — they receive props. This is container/presentational + separation of concerns without the Clean Architecture ceremony.

## Run locally

You'll need Node + pnpm and a Supabase project of your own.

```bash
# 1. Install deps
pnpm install

# 2. Set up environment
cp .env.example .env  # then fill in your Supabase URL + publishable key

# 3. Apply migrations (paste each file in order into the Supabase SQL editor)
#    supabase/migrations/0001_init_schema.sql
#    supabase/migrations/0002_seed_propfirms.sql
#    supabase/migrations/0003_drop_retired_status.sql

# 4. Regenerate types from your schema (one-time)
export SUPABASE_PROJECT_ID=<your-project-ref>
pnpm types:gen

# 5. Run
pnpm dev
```

Full Supabase setup walkthrough lives in [supabase/README.md](./supabase/README.md).

## Status

Active development. The MVP backbone is in place — auth, CRUD-create, state transitions, dashboard with real data, filters/search/sort. Coming next:

- Edit forms (currently you fix typos by deleting and recreating)
- More dashboard insights (top propfirms by ROI, breakdown by account size)
- Row actions UX redesign (move away from dropdown-only triggers)
- Public landing page
- Deployment to Vercel

## License

MIT — feel free to copy patterns, fork, or learn from the code.
