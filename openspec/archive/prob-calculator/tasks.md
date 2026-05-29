# Tasks — prob-calculator

Ordered checklist for `sdd-apply`. Each task is one atomic deliverable.
Sequential = true means downstream tasks depend on it.

---

## Phase 0 — Prerequisites

- [x] **T-01** Install shadcn checkbox + switch components
  - REQ: REQ-4
  - Sequential: true
  - Action: Run `pnpm dlx shadcn@latest add checkbox switch` from repo root.
    Verify that `src/components/ui/checkbox.tsx` and `src/components/ui/switch.tsx` do NOT already exist before running (Glob check). Both are confirmed missing — proceed unconditionally.

- [x] **T-02** Install vitest dev dependencies
  - REQ: REQ-13
  - Sequential: true (T-03 depends on this)
  - Action: Run `pnpm add -D vitest@^4 @vitest/ui@^4`. If peer-dep conflict with Vite 8 is detected, fall back to `vitest@^3 @vitest/ui@^3`. Document chosen version in a one-line comment in `vitest.config.ts`.

- [x] **T-03** Create `vitest.config.ts` at repo root
  - REQ: REQ-13
  - Sequential: true (T-16 depends on this)
  - Depends on: T-02
  - File: `/Users/ncinzer/Developer/fundout/vitest.config.ts`
  - Content: merge with `vite.config.ts` (inherits `@` alias automatically); `environment: 'node'`; `globals: true`; `include: ['src/**/*.test.ts', 'src/**/*.test.tsx']`. Include one-line comment with the installed vitest version.

- [x] **T-04** Add test scripts to `package.json`
  - REQ: REQ-13
  - Sequential: false (parallel with T-03)
  - Depends on: T-02
  - File: `/Users/ncinzer/Developer/fundout/package.json`
  - Add to `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:ui": "vitest --ui"`.

---

## Phase 1 — Engine (pure, no React)

- [x] **T-05** Create `src/features/calculator/types.ts`
  - REQ: REQ-2, REQ-5, REQ-6, REQ-7, REQ-8, REQ-12
  - Sequential: true (all engine + schema files depend on this)
  - File: `/Users/ncinzer/Developer/fundout/src/features/calculator/types.ts`
  - Exports: `DDType`, `Strategy`, `PhaseInput`, `CalcInput`, `PhaseResult`, `CalcResult` — exact shapes from design §2.

- [x] **T-06** Create `src/features/calculator/lib/calc-engine.ts`
  - REQ: REQ-5, REQ-6, REQ-7, REQ-8, REQ-12
  - Sequential: true (T-07 and T-16 depend on this)
  - Depends on: T-05
  - File: `/Users/ncinzer/Developer/fundout/src/features/calculator/lib/calc-engine.ts`
  - Implement in order: `computeStrategy`, `simulateDDFloor`, `pPhase`, `calculate`.
  - Zero React/DOM/IO imports. Only import from `../types`.
  - Critical semantics:
    - `computeStrategy`: three branches in priority order (consistency → min-days → single-shot); gap adjustment on last day when `dd + (minDays−1)×minProfit < objective`; overshoot accepted as-is; `consistencyPct=1.0` produces `days=1`.
    - `simulateDDFloor`: day-by-day loop; `cumulativeProfit = sum of prior days' targets`; EOD-Fixed lock fires when `cumulativeProfit_atStartOfDay >= dd`; before lock `ddEffective=dd`; from lock day onward `ddEffective=dd+cumulativeProfit`.
    - `pPhase`: `∏ (ddEffective_i / (ddEffective_i + dailyTargets_i))`.
    - `calculate`: aggregate `pEval` (non-funded phases only), `pTotal` (all), `W`, `EV`, `ROI=null when cEval===0`.
  - Export: `calculate`, `computeStrategy`, `simulateDDFloor`, `pPhase` (all exported for unit testing).

- [x] **T-07** Create `src/features/calculator/lib/calc-engine.test.ts`
  - REQ: REQ-5, REQ-6, REQ-7, REQ-8, REQ-13
  - Sequential: false (parallel with T-08 once T-06 is done)
  - Depends on: T-06, T-03, T-04
  - File: `/Users/ncinzer/Developer/fundout/src/features/calculator/lib/calc-engine.test.ts`
  - Test blocks in order:
    1. `describe('computeStrategy')`: consistency branch; min-days no-gap; min-days gap adjustment; min-days overshoot; `minDays=1`; single-shot; `consistencyPct=1.0` degenerates.
    2. `describe('simulateDDFloor')`: static grows; eod constant; eod-fixed locks at correct day; eod-fixed never-locks (lock never reached).
    3. `describe('calculate')`:
       - **Lucid Flex 50k fixture** (frozen inline): `cEval=140, cActivation=0`; Phase 1 `dd=2000,obj=3000,consistencyPct=0.5,ddType='eod',isFunded=false`; Phase 2 `dd=2000,obj=2600,minDays=5,minProfit=150,ddType='eod-fixed',isFunded=true,payoutCapPct=0.5,splitPct=0.9`; expect `pPhase1≈0.3265(±0.001)`, `pPhase2≈0.3846(±0.001)`, `pTotal≈0.1255(±0.001)`, `W=1170.00(±0.01)`, `EV≈6.84(±0.01)`, `ROI≈0.0489(±0.001)`.
       - `cEval=0 → roi===null`
       - `splitPct=0 → w===0, ev===-cEval`
       - `pEval` excludes funded phase, `pTotal` includes all.
  - Tolerance helpers: `toBeCloseTo(v, 3)` for probs, `toBeCloseTo(v, 2)` for money.

---

## Phase 2 — Form schema

- [x] **T-08** Create `src/features/calculator/schemas/calculator-form-schema.ts`
  - REQ: REQ-2, REQ-3, REQ-4, REQ-11
  - Sequential: true (T-09, T-10 depend on this)
  - Depends on: T-05
  - File: `/Users/ncinzer/Developer/fundout/src/features/calculator/schemas/calculator-form-schema.ts`
  - Implement `phaseSchema` + `calculatorFormSchema` exactly as in design §3.
  - Refinements: `minDays` requires `minProfit`; consistency XOR min-days mutual exclusion; `isFunded` requires `payoutCapPct` + `splitPct`; at most one funded phase; funded must be last.
  - Export `CalculatorFormValues = z.infer<typeof calculatorFormSchema>`.
  - Import `DDType` from `../types` (schema re-uses the engine type — avoids drift).

- [x] **T-09** Create `src/features/calculator/lib/form-to-input.ts`
  - REQ: REQ-10, REQ-11
  - Sequential: false (parallel with T-10 once T-08 is done)
  - Depends on: T-05, T-08
  - File: `/Users/ncinzer/Developer/fundout/src/features/calculator/lib/form-to-input.ts`
  - Single exported function `formValuesToCalcInput(values: CalculatorFormValues): CalcInput` — thin pass-through as in design §3.

---

## Phase 3 — Components

- [x] **T-10** Create `src/features/calculator/components/calculator-phase-card.tsx`
  - REQ: REQ-2, REQ-3, REQ-4, REQ-11
  - Sequential: true (T-11 depends on this)
  - Depends on: T-01, T-05, T-08
  - File: `/Users/ncinzer/Developer/fundout/src/features/calculator/components/calculator-phase-card.tsx`
  - Props: `{ index: number; onRemove: () => void; canRemove: boolean }`
  - Uses `useFormContext` + `Controller` for all fields.
  - Checkbox for consistency toggle → reveals `consistencyPct` input; enabling it hides/clears min-days toggle.
  - Checkbox for min-days toggle → reveals `minDays` + `minProfit` inputs; enabling it hides/clears consistency toggle.
  - Switch for `isFunded` → reveals `payoutCapPct` + `splitPct` inputs.
  - `ddType` Select (always visible): 4 items — static, eod, eod-fixed selectable; `trailing` as a disabled `SelectItem` with "Coming soon" label (cannot be selected, REQ-4).
  - Remove button: disabled/hidden when `!canRemove`.
  - Inline `FormMessage` per field.

- [x] **T-11** Create `src/features/calculator/components/calculator-form.tsx`
  - REQ: REQ-2, REQ-3, REQ-10
  - Sequential: true (T-13 depends on this)
  - Depends on: T-10
  - File: `/Users/ncinzer/Developer/fundout/src/features/calculator/components/calculator-form.tsx`
  - Uses `useFormContext` (no props). Costs section: two `<Input type="number">` for `cEval`, `cActivation` with `FormField`/`FormMessage`.
  - `useFieldArray({ name: 'phases', control })` for dynamic phase list.
  - "Add phase" button: disabled when `fields.length === 4`.
  - "Remove" per phase: delegated to `CalculatorPhaseCard` via `canRemove={fields.length > 1}`.
  - Maps `fields` → `<CalculatorPhaseCard index={i} onRemove={() => remove(i)} canRemove={fields.length > 1} />`.
  - No submit button — form is purely reactive.

- [x] **T-12** Create `src/features/calculator/components/calculator-results.tsx`
  - REQ: REQ-9, REQ-10
  - Sequential: false (parallel with T-11)
  - Depends on: T-05
  - File: `/Users/ncinzer/Developer/fundout/src/features/calculator/components/calculator-results.tsx`
  - Props: `{ result: CalcResult | null }`.
  - Pure presentational — no `useFormContext`, no engine import (type import only via `CalcResult`).
  - Three KPI cards: `pTotal` via `formatPercent`, `EV` via `formatCurrency`, `ROI` via `formatPercent` or `'—'` when `result.roi === null` or `result === null`.
  - Per-phase breakdown list: one row per `result.phases[i]` showing `pPhase` + strategy badge.
  - When `result === null`: all slots show `'—'`.
  - Sticky on desktop: `lg:sticky lg:top-4` Tailwind class on the container.
  - Uses `formatCurrency` and `formatPercent` from `src/lib/format.ts`.

---

## Phase 4 — Route + Nav

- [x] **T-13** Create `src/routes/_app/calculator.tsx`
  - REQ: REQ-1, REQ-9, REQ-10
  - Sequential: true (T-15 is the final verification; T-14 is independent)
  - Depends on: T-11, T-12, T-06, T-08, T-09
  - File: `/Users/ncinzer/Developer/fundout/src/routes/_app/calculator.tsx`
  - TanStack Router file-based route (`createFileRoute('/calculator')` with `_app` layout).
  - `useForm<CalculatorFormValues>({ resolver: zodResolver(calculatorFormSchema), defaultValues: DEFAULTS, mode: 'onChange' })`.
  - `DEFAULTS` seeded with Lucid Flex 50k fixture values (UX warmth; add `<p className="text-xs text-muted-foreground">Sample preset: Lucid Flex 50k — edit freely</p>` near form header).
  - `const values = useWatch({ control: form.control })`.
  - `const result = useMemo<CalcResult | null>(() => { const parsed = calculatorFormSchema.safeParse(values); if (!parsed.success) return null; return calculate(formValuesToCalcInput(parsed.data)) }, [values])`.
  - Layout: `<FormProvider {...form}>` wrapping a 2-column grid (`lg:grid lg:grid-cols-[1fr_360px]`): left = `<CalculatorForm />`, right = `<CalculatorResults result={result} />`. Stacks on `< lg`.
  - Include `<AppHeader>` (or equivalent) matching the pattern of other `_app` routes.

- [x] **T-14** Edit `src/components/common/app-sidebar.tsx` — add Calculator nav entry
  - REQ: REQ-1
  - Sequential: false (parallel with T-13)
  - File: `/Users/ncinzer/Developer/fundout/src/components/common/app-sidebar.tsx`
  - Import a suitable icon from `lucide-react` (e.g. `Calculator`).
  - Add to `navItems` array immediately after the Dashboard entry: `{ to: '/calculator', label: 'Calculator', icon: Calculator }`.
  - No other changes to the file.

---

## Phase 5 — Barrel + Verification gates

- [x] **T-15** Create `src/features/calculator/index.ts` barrel
  - REQ: REQ-12
  - Sequential: false (parallel with T-13, T-14; must exist before T-16 type-checks)
  - Depends on: T-06, T-11, T-12, T-05
  - File: `/Users/ncinzer/Developer/fundout/src/features/calculator/index.ts`
  - Re-exports: `CalculatorForm`, `CalculatorResults`, `calculate`, and all public types from `./types`.

- [x] **T-16** Run `npx tsc --noEmit` — must pass clean
  - REQ: REQ-12
  - Sequential: true (blocks T-17)
  - Depends on: all prior tasks complete
  - Action: `pnpm exec tsc --noEmit`. Fix any type errors before proceeding.

- [x] **T-17** Run `npm run build` — must pass clean
  - REQ: REQ-12
  - Sequential: true (blocks T-18)
  - Depends on: T-16
  - Action: `pnpm build`. Fix any build errors before proceeding.

- [x] **T-18** Run `npm test` — Lucid Flex 50k fixture must pass green
  - REQ: REQ-13
  - Sequential: true
  - Depends on: T-07, T-17
  - Action: `pnpm test`. All assertions in `calc-engine.test.ts` must pass. EOD-Fixed lock boundary is the most likely failure point — verify `pPhase2≈0.3846`.

- [x] **T-19** Manual UX smoke test
  - REQ: REQ-9, REQ-10
  - Sequential: false (after T-17)
  - Depends on: T-17
  - Action: Run `pnpm dev`, navigate to `/calculator`. Verify:
    - Page loads with Lucid Flex 50k preset seeded.
    - Displayed values match: pTotal≈12.55%, EV≈$6.84, ROI≈4.89%.
    - Results update without delay on any field change.
    - "Calculator" entry appears in sidebar after Dashboard.
    - Trailing ddType is visible but disabled ("Coming soon").
    - Results panel is sticky on desktop scroll.

---

## Dependency Graph (summary)

```
T-01 (shadcn) ──────────────────────────────────────────────────► T-10
T-02 (vitest install) ──► T-03 (config) ──► T-04 (scripts)
T-05 (types) ──► T-06 (engine) ──► T-07 (engine tests)
T-05 ──► T-08 (schema) ──► T-09 (form-to-input)
T-08 + T-01 ──► T-10 (phase card) ──► T-11 (form)
T-05 ──► T-12 (results)
T-11 + T-12 + T-06 + T-08 + T-09 ──► T-13 (route)
T-05 + T-06 + T-11 + T-12 ──► T-15 (barrel)
T-14 (sidebar) — independent, parallel with T-13
All ──► T-16 (tsc) ──► T-17 (build) ──► T-18 (test)
T-17 ──► T-19 (smoke)
```

### Parallelizable groups (after dependencies satisfied)

| Batch | Tasks | Gate |
|-------|-------|------|
| 0a | T-01 | none |
| 0b | T-02 → T-03, T-04 | none |
| 1a | T-05 | T-02 not needed |
| 1b | T-06 | T-05 done |
| 1c | T-07, T-08 | T-06 done (T-07); T-05 done (T-08) |
| 1d | T-09, T-10 | T-08 + T-01 done |
| 2a | T-11, T-12 | T-10 done (T-11); T-05 done (T-12) |
| 3a | T-13, T-14, T-15 | T-11+T-12+T-06+T-08+T-09 done |
| 4a | T-16 | all done |
| 4b | T-17 | T-16 clean |
| 4c | T-18 | T-17 clean |
| 4d | T-19 | T-17 clean |

---

## Review Workload Forecast

| Metric | Estimate |
|--------|----------|
| New files | 10 |
| Modified files | 2 (`package.json`, `app-sidebar.tsx`) |
| Total files touched | 12 |
| Estimated new LOC | ~650 |
| Estimated modified LOC | ~15 |
| **Total changed lines** | **~665** |
| Chained PRs recommended | No — user approved `single-pr` regardless of size |
| 400-line budget risk | High (exceeds 400 LOC) — `size:exception` pre-approved by user |
| Decision needed before apply | No |

> Delivery strategy: `single-pr`. User explicitly approved proceeding regardless of size. No blocking required.
