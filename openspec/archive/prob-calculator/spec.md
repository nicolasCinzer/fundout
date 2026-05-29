# Probability Calculator — Specification

## Purpose

Define the complete behavioral contract for the `prob-calculator` change: a stateless in-app calculator that evaluates the probability, expected value, and ROI of a multi-phase propfirm evaluation. This is a new domain — no prior spec exists; this is a full spec.

---

## Requirements

### REQ-1: Route and Navigation

The system MUST register a new authenticated route at `/calculator` using the file-based routing convention (`src/routes/_app/calculator.tsx`).

The sidebar MUST include a "Calculator" entry placed immediately after the Dashboard entry. The entry MUST link to `/calculator` and be visible to all authenticated users.

#### Scenario: Authenticated user accesses calculator

- GIVEN a user is logged in
- WHEN they navigate to `/calculator`
- THEN the calculator page renders with an empty form and a results panel showing placeholder state

#### Scenario: Sidebar navigation entry exists

- GIVEN the app sidebar is rendered
- WHEN the user inspects the navigation items
- THEN a "Calculator" entry appears after "Dashboard" and before any other tracking entries

---

### REQ-2: Form Input Model

The form MUST accept the following account-level inputs:
- `cEval` (USD, ≥ 0): evaluation cost
- `cActivation` (USD, ≥ 0): activation fee

The form MUST support 1 to 4 ordered phases. Each phase MUST include:
- `dd` (USD, > 0): drawdown limit
- `objective` (USD, > 0): profit target
- `ddType`: one of `'static'`, `'eod'`, `'eod-fixed'`; `'trailing'` MUST be rendered as a disabled option labeled "Coming soon"
- `isFunded` (boolean): marks the phase as the funded/live phase

Each phase MAY include:
- `consistencyPct` (number in (0, 1]): max daily profit as a fraction of objective
- `minDays` (integer ≥ 1) + `minProfit` (USD > 0): minimum trading days requirement; `minProfit` is required when `minDays` is set
- If `isFunded` is true: `payoutCapPct` (in (0, 1]) and `splitPct` (in (0, 1])

#### Scenario: User fills valid account costs

- GIVEN the form is displayed
- WHEN the user enters `cEval = 140` and `cActivation = 0`
- THEN the form accepts both values without error

#### Scenario: User tries to enter negative cost

- GIVEN the form is displayed
- WHEN the user enters `cEval = -10`
- THEN an inline validation error appears on the cEval field and the results do not update

---

### REQ-3: Phase List Management

The form MUST allow adding phases up to a maximum of 4. The "Add phase" button MUST be disabled when 4 phases are already present.

The form MUST allow removing any individual phase. At least 1 phase MUST remain at all times — the remove control for the last remaining phase MUST be disabled or hidden.

At most one phase may have `isFunded: true`. If any phase has `isFunded: true`, it MUST be the last phase in the ordered list. The form MUST block submission and show an inline validation error if a funded phase is not last.

#### Scenario: User adds phases up to the cap

- GIVEN the form has 3 phases
- WHEN the user clicks "Add phase"
- THEN a 4th phase is added and the "Add phase" button becomes disabled

#### Scenario: User attempts to add a 5th phase

- GIVEN the form has 4 phases
- WHEN the user inspects the "Add phase" control
- THEN it is disabled and cannot be activated

#### Scenario: User tries to place funded phase before last position

- GIVEN a 3-phase form where phase 1 has `isFunded: true` and phase 2 does not
- WHEN the form attempts to compute or submit
- THEN a validation error appears indicating the funded phase must be last

#### Scenario: Single-phase form cannot remove that phase

- GIVEN the form has exactly 1 phase
- WHEN the user inspects the remove control for that phase
- THEN the control is disabled or not rendered

---

### REQ-4: Conditional Field Reveals

The form MUST reveal `consistencyPct` only when a consistency toggle is enabled for that phase.

The form MUST reveal `minDays` and `minProfit` only when a min-days toggle is enabled for that phase.

The form MUST reveal `payoutCapPct` and `splitPct` only when `isFunded` is toggled on for that phase.

A phase MUST NOT have both `consistencyPct` and `minDays` active simultaneously. If a user enables one, the other MUST be disabled or hidden.

The `ddType` selector MUST always be visible for each phase. The `'trailing'` option MUST be rendered as disabled with a "Coming soon" badge; it MUST NOT be selectable.

#### Scenario: User enables consistency toggle

- GIVEN a phase with no strategy toggle active
- WHEN the user enables the consistency toggle
- THEN the `consistencyPct` field appears and the min-days toggle is hidden or disabled

#### Scenario: User enables isFunded toggle

- GIVEN a phase with `isFunded = false`
- WHEN the user toggles `isFunded` on
- THEN `payoutCapPct` and `splitPct` fields appear

#### Scenario: Trailing ddType is not selectable

- GIVEN the ddType selector is displayed for a phase
- WHEN the user views the options
- THEN `'trailing'` appears as a disabled item labeled "Coming soon" and cannot be selected

---

### REQ-5: Optimal Strategy Selection

The engine MUST determine a per-phase strategy from the phase inputs, applying exactly one of three branches in priority order:

1. **Consistency strategy** — when `consistencyPct` is set:
   - `dailyTarget = objective × consistencyPct`
   - `days = ceil(objective / dailyTarget)`
   - Every day has the same target

2. **Min-days strategy** — when `minDays` is set (and `consistencyPct` is not):
   - `days = minDays`
   - Day 1 target = `dd` (maximum cushion day)
   - Days 2 through `minDays` target = `minProfit`
   - Edge case — gap: if `dd + (minDays − 1) × minProfit < objective`, the final day's target MUST be adjusted upward to `objective − dd − (minDays − 2) × minProfit` to close the gap. No extra days are added.
   - Edge case — overshoot: if `dd + (minDays − 1) × minProfit > objective`, the plan is accepted as-is. The trader may reach target before all days elapse but must still trade the minimum days; the engine models the plan, not early exit.
   - Edge case — `minDays = 1`: day 1 target = `dd`. The phase is treated as a single-shot day with the full drawdown as cushion.

3. **Single-shot strategy** — when neither `consistencyPct` nor `minDays` is set:
   - `days = 1`
   - `dailyTarget = objective`

#### Scenario: Consistency strategy with 50% cap

- GIVEN `objective = 3000`, `consistencyPct = 0.5`
- WHEN the engine computes the strategy
- THEN `dailyTarget = 1500`, `days = 2`, strategy = `'consistency'`

#### Scenario: consistencyPct = 1.0 degenerates to single-shot

- GIVEN `objective = 3000`, `consistencyPct = 1.0`
- WHEN the engine computes the strategy
- THEN `dailyTarget = 3000`, `days = 1`, which is equivalent to single-shot

#### Scenario: Min-days gap edge case

- GIVEN `dd = 2000`, `objective = 2600`, `minDays = 5`, `minProfit = 150`
- WHEN the engine computes the strategy (2000 + 4×150 = 2600 = objective, no gap)
- THEN days = 5, day-1 target = 2000, days 2-5 target = 150

#### Scenario: Min-days overshoot is accepted

- GIVEN `dd = 2000`, `objective = 1000`, `minDays = 3`, `minProfit = 400`
- WHEN the engine computes the strategy (2000 + 2×400 = 2800 > 1000)
- THEN days = 3, day-1 target = 2000, days 2-3 target = 400 (plan overshoots; accepted as-is)

#### Scenario: Single-shot strategy

- GIVEN `objective = 4000`, no `consistencyPct`, no `minDays`
- WHEN the engine computes the strategy
- THEN `days = 1`, `dailyTarget = 4000`, strategy = `'single-shot'`

---

### REQ-6: Per-Day Probability (Gambler's Ruin)

For each day in the planned sequence, the engine MUST compute:

```
pDay = ddEffective / (ddEffective + dailyTarget)
```

where `ddEffective` depends on the phase's `ddType` and the current day within the success path.

**DDType rules (on the optimal success path — every day's target is hit exactly):**

- `static`: The floor is fixed at `phaseStartBalance − dd`. Therefore `ddEffective_day_N = dd + cumulativeProfit_beforeDayN`. It grows monotonically.
- `eod`: The floor trails up to match balance at end of each day. On the success path, balance increases every day, so `ddEffective = dd` (nominal) every day.
- `eod-fixed`: Behaves like `eod` (constant `ddEffective = dd`) until cumulative profit since phase start reaches `dd`. At that moment, the floor locks permanently at `phaseStartBalance`. After the lock, the floor is permanently fixed at `phaseStartBalance`. Therefore `ddEffective_dayN = balance_atStartOfDayN − phaseStartBalance = cumulativeProfit_atStartOfDay`. This grows monotonically with profit, similar to Static but with the floor anchored at the phase start rather than `phaseStartBalance − dd`. Lock condition: `cumulativeProfit_atStartOfDay ≥ dd`.

#### Scenario: Static DD effective grows with profit

- GIVEN `ddType = 'static'`, `dd = 2000`, day-1 target = 2000 (hit exactly)
- WHEN computing day 2
- THEN `ddEffective_day2 = 2000 + 2000 = 4000`

#### Scenario: EOD DD effective is constant

- GIVEN `ddType = 'eod'`, `dd = 2000`, any daily target
- WHEN computing any day
- THEN `ddEffective = 2000` regardless of cumulative profit

#### Scenario: EOD-Fixed transitions at lock point

- GIVEN `ddType = 'eod-fixed'`, `dd = 2000`, `dailyTarget = 500`
- WHEN cumulative profit reaches 2000 (after day 4, with 500/day)
- THEN from day 5 onward `ddEffective = 2000 + cumulativeProfit` (static regime)
- AND before day 5 `ddEffective = 2000` (eod regime)

---

### REQ-7: Phase Probability

The engine MUST compute the phase probability as the product of all per-day probabilities in the planned sequence:

```
pPhase = ∏ pDay  (over all days in the phase)
```

#### Scenario: Phase probability is product of daily probs

- GIVEN a 2-day phase with `pDay1 = 0.6`, `pDay2 = 0.7`
- WHEN the engine computes `pPhase`
- THEN `pPhase = 0.42`

---

### REQ-8: Aggregate Probability and Financial Metrics

The engine MUST compute:

- `pEval = ∏ pPhase` for all phases where `isFunded = false`
- `pTotal = ∏ pPhase` for all phases (eval × funded phase)
- `W = objective_funded × payoutCapPct × splitPct` (0 if no funded phase)
- `EV = pTotal × W − cEval − pEval × cActivation`
- `ROI = EV / cEval`

If `cEval = 0`, `ROI` is undefined. The engine MUST return `null` for `ROI` in this case; the UI MUST display "—".

If `payoutCapPct = 0` or `splitPct = 0`, `W = 0` and `EV = −cEval`. This is a valid (if useless) scenario; it MUST be computed and displayed normally without special warnings.

#### Scenario: Canonical Lucid Flex 50k fixture

- GIVEN `cEval = 140`, `cActivation = 0`
- AND Phase 1: `dd=2000, objective=3000, consistencyPct=0.5, ddType='eod', isFunded=false`
- AND Phase 2: `dd=2000, objective=2600, minDays=5, minProfit=150, ddType='eod-fixed', isFunded=true, payoutCapPct=0.5, splitPct=0.9`
- WHEN the engine runs `calculate(input)`
- THEN `pPhase1 ≈ 0.3265` (±0.001), `pPhase2 ≈ 0.3846` (±0.001)
- AND `pTotal ≈ 0.1256` (±0.001), `W = 1170.00` (±0.01), `EV ≈ 6.94` (±0.10), `ROI ≈ 0.0496` (±0.001)[^1]

[^1]: Hand-calculated example values in original spec used pre-rounded `pTotal = 0.1255`. Full-precision engine calculation yields `pTotal ≈ 0.12559`, which propagates to `EV ≈ 6.94` and `ROI ≈ 0.0496`. The engine is correct; the spec reference values were an artifact of the hand-calculation process using intermediate rounding.

#### Scenario: ROI undefined when cEval is zero

- GIVEN `cEval = 0`, a valid multi-phase config
- WHEN the engine runs
- THEN `roi = null`
- AND the results panel displays "—" for ROI

#### Scenario: W = 0 when split is zero

- GIVEN a funded phase with `splitPct = 0`
- WHEN the engine runs
- THEN `W = 0`, `EV = −cEval`, displayed as-is without error

---

### REQ-9: Results Display

The results panel MUST display the following KPI cards:
- `pTotal` formatted as a percentage (e.g. "12.55%")
- `EV` formatted as currency (e.g. "$6.84")
- `ROI` formatted as a percentage or "—" when undefined

The results panel MUST display a per-phase breakdown showing each phase's `pPhase` as a percentage.

All currency values MUST use `formatCurrency` from `src/lib/format.ts`. All percentage values MUST use `formatPercent` from `src/lib/format.ts`.

The results panel MUST be sticky (fixed position on desktop) so it remains visible while the user scrolls the form. On mobile it MUST stack below the form.

No charts are required in MVP.

#### Scenario: Results panel shows phase breakdown

- GIVEN a 2-phase config has been entered
- WHEN the engine returns results
- THEN the results panel shows one row or card per phase with its probability formatted as a percentage

#### Scenario: Results panel is sticky on desktop

- GIVEN the user is on a desktop viewport
- WHEN the user scrolls the form past the viewport height
- THEN the results panel remains visible in the right column

---

### REQ-10: Instant Recompute

The engine MUST be invoked on every form value change with no debounce. The results panel MUST update synchronously with the next render after any input change.

#### Scenario: Results update on field change

- GIVEN a valid form is displayed with results visible
- WHEN the user changes any input field value
- THEN the results panel updates in the same render cycle without a delay or loading indicator

---

### REQ-11: Validation and Error Display

All validation MUST be enforced via a zod schema. Invalid inputs MUST block recompute and display inline error messages per field.

Required validation rules:
- `cEval`, `cActivation` MUST be ≥ 0
- `dd`, `objective` MUST be > 0
- `consistencyPct` MUST be in (0, 1] when present
- `minDays` MUST be an integer ≥ 1 when present
- `minProfit` MUST be > 0 when `minDays` is present
- `payoutCapPct`, `splitPct` MUST be in (0, 1] when present
- Phase list MUST have 1–4 entries
- At most one phase may have `isFunded = true`
- If any phase has `isFunded = true`, it MUST be the last phase

#### Scenario: Negative drawdown is rejected

- GIVEN a phase form field for `dd`
- WHEN the user enters -500
- THEN an inline error "Must be greater than 0" appears and the engine is not called

#### Scenario: consistencyPct = 0 is rejected

- GIVEN a phase with the consistency toggle active
- WHEN the user enters `consistencyPct = 0`
- THEN an inline error appears; the engine is not called

---

### REQ-12: Engine Purity and Performance

The engine (`lib/calc-engine.ts`) MUST have zero imports from React, DOM APIs, or any I/O module. It MUST be a pure function module: same inputs always produce the same outputs with no side effects.

The engine MUST complete a `calculate()` call for a maximum-config input (4 phases, complex strategies) in under 5ms on a standard development machine.

The engine MUST export the `calculate(input: CalcInput): CalcResult` function as its primary API.

#### Scenario: Engine runs without React context

- GIVEN the engine module is imported in a vitest test (no browser, no React)
- WHEN `calculate(input)` is called with a valid input
- THEN it returns a `CalcResult` without errors or DOM access

#### Scenario: Engine is fast for max config

- GIVEN a 4-phase input with all strategies and ddTypes represented
- WHEN `calculate()` is called
- THEN it completes in under 5ms

---

### REQ-13: Regression Test Fixture

The Lucid Flex 50k canonical fixture (defined in REQ-8) MUST be encoded as an automated unit test using vitest. The test MUST fail loudly if any refactor changes the output values beyond tolerance (±0.001 for probabilities, ±0.01 for money).

Vitest MUST be introduced as the project's first test runner in this change, with `test` and `test:ui` scripts in `package.json`.

#### Scenario: Lucid Flex 50k fixture test passes

- GIVEN the vitest suite is run via `pnpm test`
- WHEN the engine is called with the Lucid Flex 50k inputs
- THEN all output values match within tolerance and the test suite reports green

#### Scenario: Broken math is caught by the fixture

- GIVEN a developer refactors EOD-Fixed logic incorrectly
- WHEN `pnpm test` runs
- THEN the Lucid Flex 50k test fails with a value mismatch message

---

## Edge Cases (Locked)

| Case | Decision |
|------|----------|
| `dd + (minDays−1) × minProfit < objective` (gap) | Final day target adjusted upward to close gap. No extra days added. |
| `dd + (minDays−1) × minProfit > objective` (overshoot) | Plan accepted as-is. Overshoot is valid; engine models the declared plan. |
| `consistencyPct = 1.0` | Degenerates to single-shot: `days = 1`, `dailyTarget = objective`. |
| `minDays = 1` | Day 1 target = `dd`. Treated as single-shot with full drawdown cushion. |
| `cEval = 0` | `roi = null`. UI displays "—". Engine does not divide by zero. |
| `payoutCapPct = 0` or `splitPct = 0` | `W = 0`, `EV = −cEval`. Computed and displayed normally. |
| Empty phase list | Blocked by zod (minimum 1 phase). Engine is never called. |
| Funded phase not last | Blocked by zod cross-field validation. Inline error shown. |
| Multiple funded phases | Blocked by zod. Only one phase may have `isFunded = true`. |

---

## Out of Scope

- Trailing intra-day drawdown math (UI shows "Coming soon"; no engine support)
- Persistence of any kind (localStorage, Supabase, URL state)
- Presets or templates
- Multi-currency (USD only)
- Sharing or export
- Scenario history or comparison
- Per-phase chart visualization
- Calibration against historical user evaluation outcomes
- E2E or component tests (vitest covers engine only in MVP)
