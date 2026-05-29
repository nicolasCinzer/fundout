# Exploration — prob-calculator

## Current State
Propfirm trading tracker with four authenticated pages (Dashboard, Evaluations, Funded Accounts, Payouts). No probability calculator yet. Consistent architecture from which the new feature derives directly.

## Stack Confirmed
- React **19** (`react@^19.2.6`), Vite 8, TypeScript 6
- TanStack Router v1 (file-based), TanStack Query v5
- shadcn/ui (radix-ui direct import), Tailwind CSS v4
- Supabase JS v2
- react-hook-form v7 + zod v4 + @hookform/resolvers v5
- recharts 3.8
- No global state manager

## Affected Areas
- `src/components/common/app-sidebar.tsx` — add nav entry
- `src/routes/_app/calculator.tsx` — new file-based route (auto-registers `/calculator`)
- `src/features/calculator/` — new feature folder:
  - `lib/calc-engine.ts` — pure math (gambler's ruin, per-phase, totals)
  - `schemas/calculator-form-schema.ts` — zod v4 schema, `useFieldArray`-compatible
  - `components/calculator-form.tsx` — dynamic phase list with conditional fields
  - `components/calculator-results.tsx` — output display
- `src/lib/format.ts` — already has `formatCurrency`, `formatPercent`, `formatDate` (reuse, no change)
- `src/features/dashboard/components/kpi-card.tsx` — reuse for result output cards

## Approaches

### A — Stateless compute (recommended MVP)
Form submits, engine runs synchronously, results display below. No persistence.
- Pros: zero backend, instantly testable pure functions, matches existing compute-* pattern in `features/dashboard/lib/`
- Cons: scenario not saved across sessions

### B — localStorage persistence
Same as A but serialize form state on compute, restore on mount.
- Pros: UX improvement, no backend
- Cons: slightly more plumbing, no cross-device sync

### C — Supabase scenarios table
Save named scenarios per user.
- Pros: cross-device, history
- Cons: schema migration + mutations + loading states; significant scope increase

## Recommendation
MVP = **A (stateless)**. localStorage is a low-risk v2 addition. Supabase persistence is a separate SDD change.

## Risks
- `useFieldArray` not currently used anywhere — first introduction
- **Checkbox/Switch components are NOT installed** — `shadcn add checkbox switch` needed before apply
- EOD+Fixed DDType has stateful simulation (floor locking mid-phase) — highest-complexity math; Lucid Flex 50k validation case (32.65% / 38.46% / 12.55%) must be unit test fixture
- No test runner configured (`package.json` has no test script) — calc engine is natural first unit-test target; testing setup may need to be established in apply phase

## Open Questions for Proposal
1. Persistence: stateless MVP, or localStorage from day 1?
2. Layout: stacked (form top, results bottom) vs two-column split (form left, results right)?
3. Nav label language: app is English throughout — "Calculator" or "Calculadora"?
4. Presets (e.g. Lucid Flex 50k): MVP or v2?

## Status
Ready for proposal. Domain is locked, codebase patterns understood, all unknowns are decisions for the proposal — not blockers.
