import { useMemo } from "react"
import { computeAccountState } from "@/features/backtest/lib/compute-account-state"
import { useBacktestSession } from "@/features/backtest/hooks/use-backtest-session"
import { useAppendBacktestEvent } from "@/features/backtest/api/backtests-queries"
import { groupLifecycles } from "@/features/backtest/lib/group-lifecycles"
import { BacktestTrackerCard } from "./backtest-tracker-card"
import { BacktestFundedCard } from "./backtest-funded-card"
import { BacktestTradeEntry } from "./backtest-trade-entry"
import { BacktestUndoButton } from "./backtest-undo-button"
import type { AccountRules, Backtest, BacktestEvent, Phase } from "@/features/backtest/types"

// ---------------------------------------------------------------------------
// BalanceTracker
//
// Orchestrator: derives phase from events (Option A — tracker-driven),
// keys sessions per lifecycle attempt + phase, and surfaces lifecycle
// transition actions (Mark funded, New eval) and payout action.
//
// Phase = funded if the CURRENT open lifecycle has an F event, else eval.
// lifecycleKey = the current lifecycle's eval event id (stable per attempt).
//
// Satisfies: C2b-2, REQ-TRANS-01..06, decision #204 (tracker-driven transitions).
// ---------------------------------------------------------------------------

type Props = {
  backtest: Backtest
  rules: AccountRules
  events: BacktestEvent[]
}

/** Derive the current phase and a stable lifecycle key from the events array. */
function derivePhaseAndKey(events: BacktestEvent[]): {
  phase: Phase
  lifecycleKey: string
  currentHasFunded: boolean
} {
  const lifecycles = groupLifecycles(events)
  if (lifecycles.length === 0) {
    return { phase: "eval", lifecycleKey: "init", currentHasFunded: false }
  }
  const current = lifecycles[lifecycles.length - 1]
  const hasFunded = current.fundedEvent !== null
  return {
    phase: hasFunded ? "funded" : "eval",
    lifecycleKey: current.evalEvent.id,
    currentHasFunded: hasFunded,
  }
}

export function BalanceTracker({ backtest, rules, events }: Props) {
  const { phase, lifecycleKey, currentHasFunded } = useMemo(
    () => derivePhaseAndKey(events),
    [events],
  )

  const appendEvent = useAppendBacktestEvent(backtest.id)

  const session = useBacktestSession(backtest.id, lifecycleKey, phase)
  const { days: sessionDays, ...ops } = session

  const state = useMemo(
    () => computeAccountState(rules, phase, sessionDays),
    [rules, phase, sessionDays],
  )

  // Phase-override: allow user to manually view the funded panel when
  // the current lifecycle is already in funded phase (phase === "funded").
  // We don't need a UI tab — the phase is DERIVED from events.
  // The only thing we need is the "Mark funded" and "New eval" action state.
  const isEval = phase === "eval"
  const isFunded = phase === "funded"

  const passEligible = state.eval?.passEligible ?? false
  const isBreached = state.final.breached

  async function handleMarkFunded() {
    // F inherits the current (selected) lifecycle's id
    const lcs = groupLifecycles(events)
    const current = lcs.length > 0 ? lcs[lcs.length - 1] : null
    if (!current) return
    await appendEvent.mutateAsync({
      input: { type: "F" },
      lifecycleId: current.evalEvent.lifecycle_id ?? current.evalEvent.id,
    })
    // The events will be re-fetched, deriving phase = "funded" automatically.
  }

  async function handleNewEval() {
    // E always mints a fresh uuid so the caller can pre-select the new account
    const newLcId = crypto.randomUUID()
    await appendEvent.mutateAsync({ input: { type: "E" }, lifecycleId: newLcId })
    // New E opens a new lifecycle. COMMIT 9 orchestration will lift selectedLifecycleId.
  }

  async function handleTakePayout(amount: number) {
    // 1. Apply withdrawal to last funded day in localStorage session
    if (sessionDays.length === 0) return
    const lastDay = sessionDays[sessionDays.length - 1]
    ops.updateDay(lastDay.id, (d) => ({ ...d, withdrawal: amount }))

    // 2. Record P event inheriting the current lifecycle's id
    const lcs = groupLifecycles(events)
    const current = lcs.length > 0 ? lcs[lcs.length - 1] : null
    if (!current) return
    await appendEvent.mutateAsync({
      input: { type: "P", amount },
      lifecycleId: current.evalEvent.lifecycle_id ?? current.evalEvent.id,
    })
  }

  return (
    <div className="@container space-y-3">
      {isEval && (
        <>
          <BacktestTrackerCard
            backtestName={backtest.name}
            rules={rules}
            state={state}
            onMarkFunded={passEligible && !currentHasFunded ? handleMarkFunded : undefined}
            onNewEval={isBreached ? handleNewEval : undefined}
            isMarkFundedPending={appendEvent.isPending}
          />
          <BacktestTradeEntry days={sessionDays} ops={ops} />
        </>
      )}

      {isFunded && (
        <>
          <BacktestFundedCard
            backtestName={backtest.name}
            rules={rules}
            state={state}
            onTakePayout={handleTakePayout}
            onNewEval={isBreached ? handleNewEval : undefined}
            isPayoutPending={appendEvent.isPending}
          />
          <BacktestTradeEntry days={sessionDays} ops={ops} />
        </>
      )}

      {/* Undo the last lifecycle event (Mark funded / payout / New eval) */}
      <BacktestUndoButton
        backtestId={backtest.id}
        events={events}
        lifecycleId={lifecycleKey}
      />
    </div>
  )
}
