# Design — prob-calculator

Authoritative technical design. The spec (`spec.md`) is the WHAT; this is the HOW at architectural level. The next phase (`sdd-tasks`) will mechanically derive a checklist from this document.

---

## 1. File Tree

```
src/
  routes/_app/
    calculator.tsx                          # Route /calculator — composes form + results, owns recompute memo
  features/calculator/
    index.ts                                # Barrel: re-exports CalculatorForm, CalculatorResults, calculate, types
    types.ts                                # Shared engine types (CalcInput, CalcResult, PhaseInput, PhaseResult, DDType, Strategy)
    lib/
      calc-engine.ts                        # Pure math: calculate(), computeStrategy(), simulateDDFloor(), pPhase()
      calc-engine.test.ts                   # Vitest suite — Lucid Flex 50k fixture + branch coverage
      form-to-input.ts                      # formValuesToCalcInput() — single mapping seam (form shape → engine shape)
    schemas/
      calculator-form-schema.ts             # Zod v4 schema + inferred CalculatorFormValues type
    components/
      calculator-form.tsx                   # RHF FormProvider + CostsSection + PhasesSection (presentational, no results awareness)
      calculator-phase-card.tsx             # Single phase row: dd/objective/ddType + toggles for consistency/min-days/funded
      calculator-results.tsx                # Props-in: receives CalcResult | null, renders KpiCards + per-phase table
```

### Files justified

- `types.ts` separated from `calc-engine.ts` because the schema needs to import types without dragging the math module into the form bundle. Engine implementation file stays focused on functions.
- `form-to-input.ts` separated from the schema because mapping is logic, schema is shape. Easier to unit-test the mapping in isolation if it grows.
- `calculator-phase-card.tsx` separated from the form because the per-phase card has its own conditional rendering state (toggles) and would bloat the form file.
- No `calculator-costs-section.tsx` extracted — the costs block is two fields; keeping it inline in `calculator-form.tsx` is cleaner than a four-line component.

### Files explicitly NOT created

- No `hooks/` folder. `useCalculator` is unnecessary indirection — the route composes RHF + memo directly in 10 lines.
- No `context/` folder. RHF's FormProvider IS the context.
- No `lib/strategies/*.ts` polymorphism. Three strategies are a `switch`, not an interface.

---

## 2. Engine API Contract

### Public surface (`features/calculator/types.ts`)

```ts
export type DDType = 'static' | 'eod' | 'eod-fixed'
export type Strategy = 'consistency' | 'min-days' | 'single-shot'

export type PhaseInput = {
  dd: number
  objective: number
  ddType: DDType
  isFunded: boolean
  consistencyPct?: number
  minDays?: number
  minProfit?: number
  payoutCapPct?: number
  splitPct?: number
}

export type CalcInput = {
  cEval: number
  cActivation: number
  phases: PhaseInput[]
}

export type PhaseResult = {
  pPhase: number
  strategy: Strategy
  days: number
  /** Per-day target array, length = days. Day 1 at index 0. */
  dailyTargets: number[]
  /** Per-day effective drawdown floor, length = days. Used for audit + UI debug if needed. */
  ddEffective: number[]
}

export type CalcResult = {
  pEval: number          // ∏ pPhase where !isFunded
  pTotal: number         // ∏ pPhase (all phases)
  w: number              // objective_funded × payoutCapPct × splitPct, or 0 if no funded phase
  ev: number             // pTotal·w − cEval − pEval·cActivation
  roi: number | null     // ev / cEval, or null when cEval === 0
  phases: PhaseResult[]
}
```

### Public function (`features/calculator/lib/calc-engine.ts`)

```ts
export function calculate(input: CalcInput): CalcResult
```

### Internal helpers (all pure, all exported for unit testing — `_test` suffix convention not used here; exports are direct since the engine is a single trusted module)

```ts
// Decides strategy + day plan for one phase.
// Returns the per-day TARGET ARRAY (length = days). Day 1 at index 0.
// For min-days, applies gap adjustment (REQ-5 edge case).
export function computeStrategy(phase: PhaseInput): {
  strategy: Strategy
  days: number
  dailyTargets: number[]
}

// Simulates the floor day-by-day along the optimal success path
// (every prior day's target hit exactly). Returns ddEffective per day.
// dailyTargets feeds cumulative profit accounting.
export function simulateDDFloor(
  phase: PhaseInput,
  dailyTargets: number[]
): number[]

// pDay_i = ddEffective_i / (ddEffective_i + dailyTargets_i)
// pPhase = ∏ pDay_i
export function pPhase(
  dailyTargets: number[],
  ddEffective: number[]
): number
```

### Execution flow inside `calculate`

```
for each phase:
  { strategy, days, dailyTargets } = computeStrategy(phase)
  ddEffective                      = simulateDDFloor(phase, dailyTargets)
  p                                = pPhase(dailyTargets, ddEffective)
  push PhaseResult

pEval  = product of phases where !isFunded
pTotal = product of all phases
funded = phases.find(isFunded)
w      = funded ? funded.objective * funded.payoutCapPct! * funded.splitPct! : 0
ev     = pTotal * w - cEval - pEval * cActivation
roi    = cEval === 0 ? null : ev / cEval
```

### Locked semantics (load-bearing)

1. **Floor simulation is day-by-day, not closed-form.** `simulateDDFloor` walks the day index, tracks `cumulativeProfit` (sum of prior days' `dailyTargets`), and applies the DDType rule per day. This is path-dependent for `eod-fixed` because the lock test runs against `cumulativeProfit_atStartOfDay`. A closed-form would require deriving the lock day index, which is brittle to refactor.
2. **EOD+Fixed lock condition** (REQ-6, spec-locked): `lock = cumulativeProfit_atStartOfDay >= dd`. Before lock: `ddEffective = dd`. From the lock day onward: `ddEffective = dd + cumulativeProfit_atStartOfDay`.
3. **Funded-phase Objetivo semantics** (user-confirmed in spec REQ-8): the same `objective` field drives BOTH the funded phase's `pPhase` (treated as a normal phase the trader must navigate to claim the payout window) AND the payout calc `W = objective × payoutCapPct × splitPct`. The engine reads `objective` once per phase and uses it in both places. No second "payout window target" field exists.
4. **Per-day target array, not a scalar.** `computeStrategy` returns `dailyTargets: number[]` because min-days gap-adjustment makes day-N target differ from days 2..N-1. A scalar `dailyTarget` would be a lie for that branch. Consistency and single-shot just produce a uniform array.

---

## 3. Form Schema (`schemas/calculator-form-schema.ts`)

Zod v4. Form values use **explicit optional + `undefined`** for conditional fields, not branded unions — RHF works better with a flat object than a discriminated union for `useFieldArray`.

```ts
import { z } from 'zod'

const phaseSchema = z.object({
  dd: z.number().positive(),
  objective: z.number().positive(),
  ddType: z.enum(['static', 'eod', 'eod-fixed']), // 'trailing' excluded from selectable values
  isFunded: z.boolean(),

  // Strategy toggles drive presence
  consistencyPct: z.number().gt(0).lte(1).optional(),
  minDays: z.number().int().gte(1).optional(),
  minProfit: z.number().positive().optional(),

  // Funded toggle drives presence
  payoutCapPct: z.number().gt(0).lte(1).optional(),
  splitPct: z.number().gt(0).lte(1).optional(),
}).superRefine((p, ctx) => {
  // min-days requires minProfit
  if (p.minDays !== undefined && p.minProfit === undefined) {
    ctx.addIssue({ code: 'custom', path: ['minProfit'], message: 'Required when min days is set' })
  }
  // mutual exclusion: consistency XOR min-days
  if (p.consistencyPct !== undefined && p.minDays !== undefined) {
    ctx.addIssue({ code: 'custom', path: ['minDays'], message: 'Cannot combine consistency and min-days' })
  }
  // funded requires payout fields
  if (p.isFunded) {
    if (p.payoutCapPct === undefined) ctx.addIssue({ code: 'custom', path: ['payoutCapPct'], message: 'Required for funded phase' })
    if (p.splitPct === undefined)     ctx.addIssue({ code: 'custom', path: ['splitPct'],     message: 'Required for funded phase' })
  }
})

export const calculatorFormSchema = z.object({
  cEval: z.number().gte(0),
  cActivation: z.number().gte(0),
  phases: z.array(phaseSchema).min(1).max(4),
}).superRefine((v, ctx) => {
  const fundedIndexes = v.phases.flatMap((p, i) => p.isFunded ? [i] : [])
  if (fundedIndexes.length > 1) {
    ctx.addIssue({ code: 'custom', path: ['phases'], message: 'Only one phase may be funded' })
  }
  if (fundedIndexes.length === 1 && fundedIndexes[0] !== v.phases.length - 1) {
    ctx.addIssue({ code: 'custom', path: ['phases', fundedIndexes[0], 'isFunded'], message: 'Funded phase must be last' })
  }
})

export type CalculatorFormValues = z.infer<typeof calculatorFormSchema>
```

### Form → engine mapping (`lib/form-to-input.ts`)

```ts
import type { CalcInput } from '../types'
import type { CalculatorFormValues } from '../schemas/calculator-form-schema'

export function formValuesToCalcInput(values: CalculatorFormValues): CalcInput {
  return {
    cEval: values.cEval,
    cActivation: values.cActivation,
    phases: values.phases.map(p => ({
      dd: p.dd,
      objective: p.objective,
      ddType: p.ddType,
      isFunded: p.isFunded,
      consistencyPct: p.consistencyPct,
      minDays: p.minDays,
      minProfit: p.minProfit,
      payoutCapPct: p.payoutCapPct,
      splitPct: p.splitPct,
    })),
  }
}
```

This is a thin pass-through TODAY because the shapes are aligned by design. Its existence is the SEAM: if form ever adopts a richer shape (e.g. per-phase notes, UI-only flags), only this function changes.

---

## 4. Form ↔ Engine Wiring

### Recompute strategy: **`useWatch` at the route + `safeParse` guard + `useMemo`**

In `routes/_app/calculator.tsx`:

```tsx
const form = useForm<CalculatorFormValues>({
  resolver: zodResolver(calculatorFormSchema),
  defaultValues: DEFAULTS,
  mode: 'onChange',
})

const values = useWatch({ control: form.control })

const result = useMemo<CalcResult | null>(() => {
  const parsed = calculatorFormSchema.safeParse(values)
  if (!parsed.success) return null
  return calculate(formValuesToCalcInput(parsed.data))
}, [values])

return (
  <FormProvider {...form}>
    <Layout
      form={<CalculatorForm />}
      results={<CalculatorResults result={result} />}
    />
  </FormProvider>
)
```

### Why `useWatch` over `form.watch()`

- `useWatch` subscribes via the control without forcing the host component to re-render on every keystroke at the unrelated form level. The route only re-renders when watched values change.
- Keeps the form component "presentational" — it does not need access to results. Results are computed by the route, which composes both panels.
- `watch()` inside `CalculatorForm` would force `CalculatorForm` to be the recompute owner, which couples form rendering to results rendering.

### Why guard-with-safeParse

- Engine types use REQUIRED numbers (`dd: number`). While the user is typing, form values can be empty strings → `undefined` → invalid. Letting `calculate` see invalid input would force defensive code in the engine, polluting the math with UI concerns.
- `safeParse` is the single gate: if it passes, the engine sees clean validated data. If it fails, results show `—`.
- Cost: one extra zod parse per change. Zod v4 is fast; the engine guard (REQ-12 requires < 5ms) absorbs it.

### Behavior matrix

| Form state | `result` | UI |
|---|---|---|
| All valid | `CalcResult` | KPI cards + phase rows populated |
| Any field invalid | `null` | KPI cards show `—`, phase rows show `—` |
| Empty form (initial load) | `null` or seed | Shows defaults (Lucid Flex 50k seeded as DEFAULTS for UX warmth) |

### Defaults

`DEFAULTS` in the route is seeded with the Lucid Flex 50k fixture so the page is non-empty on first visit. This is a UX choice, not a spec requirement, but it makes the demo immediate.

---

## 5. Component Decomposition

### `Route /calculator` (`routes/_app/calculator.tsx`)

- Creates the form via `useForm`
- Wires `useWatch` → `safeParse` → `useMemo(calculate)`
- Renders `<AppHeader>` + split layout (form left, sticky results right)
- Stacks on `< lg`

### `CalculatorForm` (`components/calculator-form.tsx`)

- Reads form from `useFormContext` (no props needed — the route provides FormProvider)
- Renders costs section (two number inputs) + phases section
- Phases section uses `useFieldArray({ name: 'phases', control })` for add/remove
- "Add phase" disabled when `fields.length === 4`
- "Remove phase" hidden when `fields.length === 1`
- Maps over `fields` rendering `<CalculatorPhaseCard index={i} onRemove={...} canRemove={fields.length > 1} />`

### `CalculatorPhaseCard` (`components/calculator-phase-card.tsx`)

Props:
```ts
type Props = { index: number; onRemove: () => void; canRemove: boolean }
```

- Owns local toggle UI (consistency / min-days / isFunded). Toggles map to setting form values to `undefined` when off.
- Uses `useFormContext` + `Controller` for shadcn primitives (`Switch`, `Checkbox`, `Select` for ddType, `Input type="number"` for amounts).
- ddType `Select` includes a disabled `<SelectItem value="trailing" disabled>Trailing — coming soon</SelectItem>`.
- Conditional reveals: consistency toggle clears `minDays`/`minProfit` and vice-versa (enforced in handler, validated by schema).

### `CalculatorResults` (`components/calculator-results.tsx`)

Props:
```ts
type Props = { result: CalcResult | null }
```

- **Pure presentational. No form awareness, no `useFormContext`, no engine import beyond the type.**
- Renders three `<KpiCard>` instances: `pTotal` (`formatPercent`), `EV` (`formatCurrency(value, true)`), `ROI` (`formatPercent` or `'—'` when null).
- Renders a per-phase table/list with each phase's `pPhase` formatted as percent + a strategy badge.
- Receives `null` while form is invalid → renders `—` placeholders in every slot.
- Sticky positioning on `lg+` via Tailwind `lg:sticky lg:top-4`.

---

## 6. shadcn Additions

Already installed: `card`, `select`, `input`, `button`, `table`, `dropdown-menu`, `sidebar`, `tooltip`, `avatar`, others.

NOT installed (verified via Glob):
```
src/components/ui/checkbox.tsx   — MISSING
src/components/ui/switch.tsx     — MISSING
src/components/ui/radio-group.tsx — MISSING (decided not needed)
```

### Commands required before apply

```sh
pnpm dlx shadcn@latest add checkbox switch
```

Decision: use `Select` (already installed) for `ddType`, NOT `RadioGroup`. Three options + a disabled "coming soon" is cleaner as a select dropdown and avoids one more dependency.

Decision: use `Switch` for `isFunded` (single boolean toggle) and `Checkbox` for the strategy toggles (consistency / min-days), matching shadcn conventions (switches for state, checkboxes for opt-in).

---

## 7. Testing Setup

### Vitest version

Pinned target: **`vitest@^4.1.0`** (current at time of design; aligns with Vite 8). Apply phase MUST verify the latest 4.x at install time; if 4.x is not yet GA for Vite 8 at apply time, fall back to `vitest@^3` with documented reason.

Dev deps to add:
```
vitest@^4
@vitest/ui@^4
@testing-library/jest-dom  — NOT NEEDED (engine tests only, no DOM)
jsdom                       — NOT NEEDED (environment: 'node')
```

### `vitest.config.ts` (new file at repo root)

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  })
)
```

Merging with `vite.config.ts` inherits the `@` alias automatically. No need for `vite-tsconfig-paths`.

### `package.json` script additions

```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui"
```

### Test file layout

Colocated: `src/features/calculator/lib/calc-engine.test.ts` next to `calc-engine.ts`.

Top-level describe blocks (covers REQ-5, REQ-6, REQ-7, REQ-8, REQ-13):

```
describe('computeStrategy')
  - consistency branch
  - min-days branch (no gap, gap adjustment, overshoot, minDays=1)
  - single-shot branch
  - consistencyPct = 1.0 degenerates to single-shot

describe('simulateDDFloor')
  - static: grows with cumulative profit
  - eod: constant at dd
  - eod-fixed: locks at correct day (mid-phase, never, final day)

describe('calculate')
  - Lucid Flex 50k canonical fixture (frozen inline)
    expects pPhase1 ≈ 0.3265, pPhase2 ≈ 0.3846,
            pTotal ≈ 0.1255, W = 1170.00,
            EV ≈ 6.84, ROI ≈ 0.0489
  - cEval = 0 → roi === null
  - splitPct = 0 → w === 0, ev === -cEval
  - phase composition: pEval excludes funded, pTotal includes all
```

Tolerance helpers: `expect(v).toBeCloseTo(expected, 3)` for probabilities (±0.001), `toBeCloseTo(expected, 2)` for money.

---

## 8. Approach Choices (rationale)

### Day-by-day floor simulation vs closed-form

The EOD+Fixed regime locks based on `cumulativeProfit_atStartOfDay >= dd`. On the success path, profit is the sum of prior days' targets, which differ per day in the min-days branch. The lock-day index is a function of the cumulative-target sequence, which is itself a piecewise function. Deriving a closed-form is possible but brittle — any spec change to min-days target shape would force re-derivation. A simple `for (let i = 0; i < days; i++)` loop is auditable, mirrors the math in the spec, and is O(days). With days ≤ ~10 in realistic configs, the cost is irrelevant.

### `useWatch` at route level vs `watch()` inside form

The form should not know that results exist. `useWatch` at the route composes both panels at the same layer; the form is purely a controlled-inputs component. This also avoids `watch()`'s render-the-whole-form behavior, which would re-render every phase card on every keystroke in any phase.

### Guard-with-safeParse vs compute-on-anything

The engine has REQUIRED numeric inputs. Defending against `undefined` / `NaN` / empty-string inside the engine would force every helper to be partial-input-tolerant, polluting the math with UI concerns. Better: one zod parse at the boundary, and the engine is allowed to assume validity. Performance cost is negligible.

### Vitest now vs deferred

The engine is the canonical first test target: pure functions, no DOM, no async. The Lucid Flex 50k fixture has audited expected outputs — without a test, any future refactor silently breaks the math. The cost is one config file plus three dev deps. Deferring this would mean shipping unverified math.

---

## 9. Explicitly Out of Scope (and where each would go)

| Out-of-scope item | Where it would go if added |
|---|---|
| Global state for form values | `features/calculator/store.ts` (zustand) — NOT NEEDED today |
| Strategy polymorphism (Strategy interface) | `lib/strategies/{consistency,min-days,single-shot}.ts` — only if strategies grow beyond 4 |
| Trailing DDType | New `case 'trailing':` branch in `simulateDDFloor` + enum update — clean addition |
| Scenario history | `features/calculator/api/scenarios-queries.ts` (Supabase) — new SDD change |
| Localstorage persistence | `useEffect` in route + `useLocalStorage` hook — separate change |
| Component tests for the form | `calculator-form.test.tsx` w/ jsdom + RTL — separate testing-strategy change |
| Engine context provider | `features/calculator/context/calculator-provider.tsx` — RHF FormProvider is sufficient today |

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| EOD+Fixed lock-boundary off-by-one (lock on day K vs K-1) | Lucid Flex 50k fixture uses min-days=5 with minProfit=150, dd=2000 → lock condition `cumulativeProfit ≥ 2000` is reached exactly when entering day 2 (day 1 target = 2000). The 4-decimal expected pPhase2 ≈ 0.3846 only matches if the lock fires on day 2, not day 1 or day 3. Off-by-one breaks the fixture loudly. |
| `useFieldArray` re-render thrash with reactive results | `useWatch` (not `watch()`) at the route subscribes via control without rebroadcasting to every field component. Each `CalculatorPhaseCard` reads through `useFormContext` + `Controller` for its own fields, isolating re-renders. |
| Form schema and engine types drift | Engine `types.ts` is the source of truth. The schema imports `DDType` from there. `formValuesToCalcInput` is the single seam — drift surfaces as a TypeScript error at the mapping site, not as silent runtime bugs. |
| Vitest 4 not yet compatible with Vite 8 | Apply phase verifies the resolution at install. Fallback documented: pin `vitest@^3` with a note in the dev-dep changelog. |
| Defaults seeded with Lucid Flex 50k might confuse first-time users into thinking values are saved | Add a small `<p className="text-xs text-muted-foreground">Sample preset: Lucid Flex 50k — edit freely</p>` near the form header. Cheap UX guardrail. |

---

## 11. Conformance to Spec

This design implements every REQ-1 through REQ-13 without deviation:

- REQ-1 (route + nav): `routes/_app/calculator.tsx` + `app-sidebar.tsx` insertion after Dashboard.
- REQ-2 (input model): `phaseSchema` + `calculatorFormSchema`.
- REQ-3 (phase list mgmt): `useFieldArray`, cap=4, min=1, funded-must-be-last in `superRefine`.
- REQ-4 (conditional reveals): `CalculatorPhaseCard` toggles + schema mutual-exclusion refinement.
- REQ-5 (optimal strategy): `computeStrategy` with three branches, gap adjustment, overshoot acceptance, minDays=1 single-shot equivalence.
- REQ-6 (per-day prob + DDType): `simulateDDFloor` with three regime cases including EOD-Fixed lock at `cumulativeProfit_atStartOfDay >= dd`.
- REQ-7 (phase prob): `pPhase` returns `∏ pDay`.
- REQ-8 (aggregates): `calculate` final block. `roi = null` when `cEval = 0`. `W = 0` when split or cap is 0.
- REQ-9 (results display): `CalculatorResults` with KpiCard reuse, sticky on desktop, formatCurrency/formatPercent.
- REQ-10 (instant recompute): `useWatch` + `useMemo`, no debounce.
- REQ-11 (validation): zod schema rejects invalid inputs; `safeParse` gate.
- REQ-12 (engine purity): `lib/calc-engine.ts` imports only from `../types`. No React, no DOM, no I/O.
- REQ-13 (regression fixture): Lucid Flex 50k as vitest test; `pnpm test` script added.

**Zero spec disagreements.**
