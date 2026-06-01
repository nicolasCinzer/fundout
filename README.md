# Fundout

> The propfirm tracker and decision-support suite for traders who treat the challenge economy as a business, not a lottery.

Prop trading firms have turned trader evaluations into a recurring product. For every funded account, traders pay for several attempts, resets, and add-ons — and most existing tools (Tradezella, Edgewonk, broker journals) focus on the trades themselves, not on the **meta-game** that surrounds them.

Fundout closes that gap. It tracks the full economic loop of a propfirm career — fees in, payouts out, accounts active, attempts wasted — and pairs it with a set of quantitative tools to decide which firms, account sizes, and risk profiles are actually worth the capital and time.

The question every prop trader eventually asks is simple: **am I making money playing this game, and which version of the game has the best odds?** Fundout is built to answer both.

---

## What Fundout does

Fundout is split into two complementary surfaces: a **tracker** that records the journey, and a **toolkit** that helps decide what to do next.

### Tracker — the meta-game ledger

- **Evaluations, funded accounts, and payouts** modeled as first-class entities with explicit state transitions (`in_progress → passed/failed`, `funded → paid_out/closed`).
- **One-click "Mark as funded"** runs a compound mutation — closes the evaluation and creates the matching funded account in a single user action.
- **Dashboard** with the six KPIs that matter: net P&L, total spent, total payouts (net), funding ratio, payout ratio, and active funded accounts — plus a daily fees-vs-payouts flow chart and a Propfirms-by-ROI breakdown.
- **URL-state filters, search, and sortable columns** on every table — bookmarkable, shareable, survive refresh.
- **Period switching** on the dashboard (this month, this year, all time) recomputes every metric in place.

### Toolkit — quantitative decision support

Two analytical tools, both pure-function engines with the math separated from the UI:

#### `/calculator` — Probability & ROI Calculator

A deterministic, **gambler's-ruin-based** probability calculator for multi-phase propfirm challenges. Given account rules (target, max drawdown, daily loss limit) and a trader profile (risk per trade, expected edge), it computes:

- Probability of passing each phase and the full evaluation
- Expected ROI over an evaluation + funded cycle
- Average attempts to fund, average attempts to first payout
- A **Strategy Lab** that runs the same input through alternative non-analytic strategies (Monte Carlo cushion variants) and shows the trade-offs side by side

Form inputs persist to `localStorage`, so a trader can come back the next day without re-entering the firm's rules.

#### `/bankroll-mc` — Bankroll Monte Carlo Simulator

A portfolio-level simulator that answers the question the single-attempt calculator can't: **starting from bankroll B, how likely am I to go broke before reaching N evaluation attempts?**

- 10,000 Monte Carlo runs with a fixed seed (reproducible across reloads and shares)
- Configurable per-attempt cost, payout probability, and net payout
- Renders p10 / p50 / p90 trajectory bands plus the ruin probability and the worst-case "max attempts with no payouts" streak
- Pure synchronous engine — runs on the main thread in under 100 ms for the default workload

---

## Why these tools, together

A propfirm career has two levels of decision:

1. **Per-attempt**: given this firm's rules and my edge, what's my expected probability and ROI? → `/calculator`
2. **Portfolio-level**: given my bankroll and a stream of attempts, what's the probability I run out of capital before I hit a payout? → `/bankroll-mc`

The tracker measures the actual realized outcome of those decisions over time, closing the feedback loop. Each piece is useful on its own; together they form a decision system rather than a journal.

---

## Status

Fundout is in active development. The tracker MVP, the probability calculator, and the bankroll simulator are all live and usable end-to-end. Current focus is on UX polish (edit forms, row actions), additional dashboard insights, and a public landing page ahead of deployment.

---

## Technical details

### Stack

- **Build**: Vite 8, React 19, TypeScript 6 (strict mode, zero `any`)
- **Routing**: TanStack Router — file-based, code-split per route, URL state validated with Zod
- **Data**: TanStack Query against Supabase (Postgres + Row-Level Security + magic-link auth)
- **Styling**: Tailwind v4, [shadcn/ui](https://ui.shadcn.com) (new-york style), dark mode with FOUC-prevention inline script
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts via shadcn chart primitives
- **Testing**: Vitest — 80+ tests covering the calculator and Monte Carlo engines
- **Deploy**: Vercel + Supabase Cloud (planned)

### Architecture

The codebase is organized to make the domain shout louder than the framework.

- **Screaming Architecture** — `src/features/{evaluations,funded-accounts,payouts,dashboard,calculator,bankroll-mc,auth,propfirms}` over layer-first organization. Each feature is autonomous: components, hooks, schemas, queries, engines. A new contributor opens `src/features/` and understands the product in five seconds.
- **Pure-function engines** — the calculator and Monte Carlo engines are pure functions that take typed input and return typed output. The route orchestrates the queries and calls compute; components receive props. Container/presentational + separation of concerns without the Clean Architecture ceremony.
- **Schema-enforced invariants** — business rules live in the database. `funded_accounts.evaluation_id UNIQUE` enforces the 1:1 relationship; `numeric(12,2)` for every monetary column (never `float`); `CHECK` constraints enforce status/timestamp coherence; `ON DELETE` is `CASCADE` for owned data and `RESTRICT` for references.
- **RLS as the security boundary** — every table has Row-Level Security scoped to `auth.uid()`. RLS uses `(select auth.uid())` instead of `auth.uid()` directly — a Supabase 2025 best practice that lets Postgres cache the call as an `InitPlan` rather than re-evaluating per row.
- **URL state for table and tool interactions** — filters, search, sort, and tool inputs live in the URL or `localStorage`. Zod schemas use `.catch(undefined)` per field to degrade gracefully on malformed input.
- **Spec-driven development** — non-trivial features (probability calculator, Strategy Lab, bankroll simulator) are designed through an explicit explore → propose → spec → design → tasks → apply → verify → archive workflow before any code is written. Specifications and design decisions are persistent project artifacts.

### Run locally

You'll need Node, pnpm, and a Supabase project of your own.

```bash
# 1. Install deps
pnpm install

# 2. Set up environment — copy .env.example, fill in your Supabase URL + publishable key
cp .env.example .env

# 3. Link the Supabase CLI to your project (one-time)
pnpm exec supabase login
pnpm exec supabase link --project-ref <your-project-ref>

# 4. Push schema migrations
pnpm db:push

# 5. Generate TypeScript types from the schema
export SUPABASE_PROJECT_ID=<your-project-ref>
pnpm types:gen

# 6. Run
pnpm dev
```

Full Supabase setup walkthrough lives in [supabase/README.md](./supabase/README.md).

## License

MIT — feel free to copy patterns, fork, or learn from the code.
