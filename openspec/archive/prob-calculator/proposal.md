# Proposal — prob-calculator

## Problem
Propfirm traders evaluating an offer (Lucid Flex 50k, FTMO 100k, etc.) face a multi-phase challenge with non-trivial math: each phase has its own profit target, drawdown rule, optional consistency cap, and optional minimum-days requirement. The "is this offer worth attempting?" decision currently has no quantitative answer in Fundout. Traders eyeball it or maintain their own spreadsheets.

This change adds an in-app **Calculator** that, given an evaluation's cost structure and phase rules, produces:
- Probability of passing the full evaluation (`P_eval`)
- Probability of reaching a funded payout (`P_total`)
- Expected dollar payout `W` and expected value `EV`
- ROI multiple on the evaluation fee
- Per-phase probability breakdown

The math is locked: per-phase gambler's ruin with phase-specific optimal strategy (consistency-bound, min-days-bound, or single-shot), composed across all phases, modulated by three drawdown regimes (Static, EOD, EOD+Fixed).

## Goals
1. **Correct math**, validated against the canonical Lucid Flex 50k fixture: `P_total = 32.65%`, `P_eval = 38.46%`, `P_funded = 12.55%`, `W = 6.84 USD`, `ROI = 0.049x`.
2. **Fast iterative UX** — traders tweak inputs and see results update without page round-trips. Sticky results panel keeps numbers visible while editing.
3. **Clean engine separation** — `lib/calc-engine.ts` is pure, React-free, fully unit-testable, and ready for a future "calibrate against historical user data" extension without rewrites.
4. **Establish a test runner** — engine is the first unit-test target in the repo; the Lucid Flex 50k case becomes the regression fixture for all future probability changes.

## Non-Goals (out of MVP scope)
- Persistence of any kind: no localStorage, no Supabase, no URL-encoded state, no saved scenarios.
- Presets / templates (Lucid Flex 50k, FTMO, etc.).
- Trailing intra-day drawdown — surfaced in the UI as "coming soon" / disabled option.
- Historical user data integration (calibration against the user's real evaluation outcomes).
- Monthly recurring costs — all costs treated as one-time (`C_eval`, `C_activation`).
- Multi-currency — USD only.
- Sharing / export.

These are deferred to follow-up changes; the engine boundary is designed so they can be added without touching the math.

## High-Level Approach

### Architecture
Three layers, strict dependency direction (engine knows nothing about React; form knows nothing about results; results renders from engine output):

```
calculator-form.tsx  --(CalcInput)-->  calc-engine.ts  --(CalcResult)-->  calculator-results.tsx
   (RHF + zod)                          (pure functions)                   (KpiCard reuse)
```

### Route + nav
- New file-based route: `src/routes/_app/calculator.tsx` → auto-registers `/calculator`.
- Sidebar entry in `src/components/common/app-sidebar.tsx`, label **"Calculator"**, placed after Dashboard.

### Layout
**Split 2-column** matching the user's screenshot reference:
- Left column: form (account costs, then dynamic phase list).
- Right column: **sticky** results panel (KPI grid + per-phase breakdown table).
- Stacks vertically on small screens.

### Recompute trigger
**Reactive on form change, no debounce.** Rationale:
- The engine is O(N) over phases (typically ≤ 3) — sub-millisecond cost. Debouncing adds perceived lag for no measurable benefit.
- RHF `watch()` or `useWatch()` already produces a re-render-friendly value stream.
- If profiling later shows a problem (e.g. user adds 20 phases), a debounce is a one-line addition.

Open for spec confirmation if there's a concern, but recommendation is **instant**.

### Engine shape (sketch — locked in spec phase)
```ts
type DDType = 'static' | 'eod' | 'eod-fixed';
type PhaseInput = {
  dd: number; objective: number;
  consistencyPct?: number;
  minDays?: number; minProfit?: number;
  ddType: DDType;
  isFunded: boolean;
  payoutCapPct?: number; splitPct?: number; // funded only
};
type CalcInput = { cEval: number; cActivation: number; phases: PhaseInput[] };
type PhaseResult = { pPhase: number; strategy: 'consistency'|'min-days'|'single-shot'; days: number; dailyTarget: number };
type CalcResult = { pTotal: number; pEval: number; w: number; ev: number; roi: number; phases: PhaseResult[] };
export function calculate(input: CalcInput): CalcResult;
```

Internal helpers (all pure):
- `computeStrategy(phase) → { days, dailyTarget, strategy }`
- `pDayStatic(ddInitial, accumulatedProfit, dailyTarget)` — DD_effective = ddInitial + accumulatedProfit
- `pDayEOD(dd, dailyTarget)` — DD_effective = dd
- `pDayEODFixed(...)` — simulates day-by-day until trailing locks at start, then behaves like static
- `pPhase(phase) → product of pDay over the planned day sequence`

### Form
- `react-hook-form` v7 with `zodResolver` (v4 schema).
- `useFieldArray` for phases — **first introduction in the codebase**, isolated to this feature.
- Conditional fields per phase:
  - `consistency` toggle reveals `consistencyPct`
  - `min-days` toggle reveals `minDays` + `minProfit`
  - `isFunded` toggle reveals `payoutCapPct` + `splitPct`
- "Add phase" / "Remove phase" controls.

## Module Boundaries

| Module | Depends on | Knows about |
|--------|------------|-------------|
| `lib/calc-engine.ts` | nothing (no React, no zod) | pure types only |
| `schemas/calculator-form-schema.ts` | zod, engine types | form ↔ engine mapping |
| `components/calculator-form.tsx` | RHF, schema, shadcn primitives | form UX |
| `components/calculator-results.tsx` | engine result type, `KpiCard`, `format.ts` | display only |
| `routes/_app/calculator.tsx` | both components | layout + state wiring |

The engine never imports from `components/` or `schemas/`. The schema maps form values to `CalcInput` — this is the only place form-shape changes affect engine call sites.

## Testing Strategy

### Introduce vitest
The repo has no test runner. This change establishes one:
- `vitest` + `@vitest/ui` (dev deps)
- `test` and `test:ui` scripts in `package.json`
- `vitest.config.ts` aligned with the existing Vite config (path aliases via `vite-tsconfig-paths`)

### Coverage targets (MVP)
1. **Lucid Flex 50k canonical fixture** — full `calculate()` round-trip, asserts `P_total`, `P_eval`, `P_funded`, `W`, `ROI` against the locked numbers (tolerance: `±0.01%` for probabilities, `±0.01 USD` for money).
2. **Strategy selection** — three branches (consistency / min-days / single-shot) each with a deterministic input → expected `{ days, dailyTarget }`.
3. **DDType simulations** — one phase per regime: Static (accumulation), EOD (constant), EOD+Fixed (lock point reached mid-phase + lock point not reached).
4. **Phase composition** — `P_total = ∏ P_phase`, `P_eval = ∏ P_phase where !isFunded`.
5. **EV / ROI arithmetic** — given known phase probs, verify `EV = P_total·W − C_eval − P_eval·C_activation` and `ROI = EV / C_eval`.

The engine being React-free means tests run instantly with no DOM setup.

### Out of scope for MVP tests
- Component tests for the form (RHF + zod is well-tested upstream; form is mostly wiring).
- E2E. Not yet warranted.

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **EOD+Fixed lock simulation** is the most complex math — easy to get the lock-point boundary wrong | High | Day-by-day simulation (not closed-form) keeps it auditable; dedicated unit tests for "locks on day K", "never locks", "locks on final day" |
| **No test runner installed** — adds setup work to apply phase | Medium | Vitest is the canonical Vite test runner — minimal config, well-trodden path. Setup is part of this change's apply, not a separate prerequisite |
| **`useFieldArray` first use in repo** — team has no prior pattern to copy | Medium | Self-contained in one component; RHF docs are authoritative; complexity is low (add/remove rows, no nested arrays) |
| **Missing shadcn primitives** (`checkbox`, `switch`) | Low | One command before apply: `pnpm dlx shadcn@latest add checkbox switch`. Block apply if not run |
| **Math validation drift** — future refactor breaks Lucid Flex numbers silently | Medium | Canonical fixture test fails loudly; CI hook for `pnpm test` is a follow-up but the fixture is the line of defense |
| **Reactive recompute on every keystroke** could feel laggy on slow devices with many phases | Low | Engine is O(N_phases × avg_days_per_phase) — fast. Easy to add `useDebouncedValue` if profiling shows an issue |

## Open Questions for Spec Phase

1. **Max phases.** Hard cap (e.g. 5) for UI sanity, or unlimited? Lucid Flex uses 3; FTMO uses 2; "unlimited" might invite garbage input.
2. **Input validation rules.**
   - DD and Objetivo: positive, non-zero. What about `Objetivo > DD`? (Lucid Flex 50k phase 1 has DD 2500, Obj 4000 — Obj > DD is common.)
   - Consistency %: range (0, 1)? Or (0, 1]? At exactly 1.0 the formula degenerates to single-shot.
   - PayoutCap / Split: range [0, 1]. What if both are 0? `W = 0` → `EV = −C_eval` (valid but useless — warn?).
3. **MinDays + MinProfit semantics.** Spec must lock the exact day-1-cushion formula vs. days-2..N-min-profit formula. Exploration says day 1 target = DD (cushion), days 2..N = MinProfit. Confirm and unit-test edge case where `MinDays = 1`.
4. **EOD+Fixed lock condition.** "Trails until profit = initial DD" — does "profit" mean cumulative profit since phase start, or peak equity − start? They differ if drawdown happens. Spec must pin this.
5. **Recompute trigger** — confirm instant (no debounce) is fine, or pin a debounce value (e.g. 100ms).
6. **Zero/negative input UX.** Block submit via zod (`.positive()`), or accept and show `P = NaN`? Recommend block via schema.
7. **Trailing intra-day option** — disable the radio item with a "coming soon" badge, or omit it entirely from the UI? Recommend disable + badge (signals future support).
8. **Funded phase Objetivo semantics.** Funded phase has no profit target to "pass" — Objetivo is interpreted as the payout-window target. Spec must clarify how `P_phase` is computed for the funded phase (is it `pPhase(funded)` over the payout window, or does the funded phase contribute differently to `P_total`?).

## Status
Ready for spec + design (can run in parallel).
