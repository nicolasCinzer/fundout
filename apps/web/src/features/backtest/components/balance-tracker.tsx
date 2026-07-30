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
// BalanceTracker — CONTROLLED child (multi-account refactor, ADR-7)
//
// Receives selectedLifecycleId from backtest-detail-page (the owner).
// Renders the balance card, trade entry, and undo button for the SELECTED
// lifecycle only.
//
// No longer derives "the last lifecycle" — all state is passed in as props.
// ---------------------------------------------------------------------------

type Props = {
  backtest: Backtest
  rules: AccountRules
  events: BacktestEvent[]
  /** The currently selected lifecycle's id (controlled from parent). */
  selectedLifecycleId: string | null
  /** Called when user selects a different lifecycle chip. */
  onSelect: (lifecycleId: string) => void
  /** Called when user wants to open a new evaluation. */
  onNewEval: () => void
}

export function BalanceTracker({
  backtest,
  rules,
  events,
  selectedLifecycleId,
}: Props) {
  const appendEvent = useAppendBacktestEvent(backtest.id)

  // Derive the selected lifecycle from events + selectedLifecycleId
  const lifecycles = useMemo(() => groupLifecycles(events), [events])
  const selectedLc = useMemo(
    () => (selectedLifecycleId ? lifecycles.find(lc => lc.evalEvent.lifecycle_id === selectedLifecycleId) ?? null : null),
    [lifecycles, selectedLifecycleId],
  )

  // Determine phase and lifecycle key for session management
  const phase: Phase = selectedLc?.fundedEvent ? "funded" : "eval"
  const lifecycleKey = selectedLc?.evalEvent.id ?? "init"

  const session = useBacktestSession(backtest.id, lifecycleKey, phase)
  const { days: sessionDays, ...ops } = session

  const state = useMemo(
    () => computeAccountState(rules, phase, sessionDays),
    [rules, phase, sessionDays],
  )

  const isEval = phase === "eval"
  const isFunded = phase === "funded"
  const passEligible = state.eval?.passEligible ?? false
  const currentHasFunded = selectedLc?.fundedEvent !== null

  async function handleMarkFunded() {
    if (!selectedLifecycleId) return
    await appendEvent.mutateAsync({
      input: { type: "F" },
      lifecycleId: selectedLifecycleId,
    })
  }

  async function handleTakePayout(amount: number) {
    if (!selectedLifecycleId || sessionDays.length === 0) return
    const lastDay = sessionDays[sessionDays.length - 1]
    ops.updateDay(lastDay.id, (d) => ({ ...d, withdrawal: amount }))
    await appendEvent.mutateAsync({
      input: { type: "P", amount },
      lifecycleId: selectedLifecycleId,
    })
  }

  if (!selectedLc) {
    // No lifecycle selected (empty state — no events yet or all breached)
    return null
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
            isPayoutPending={appendEvent.isPending}
          />
          <BacktestTradeEntry days={sessionDays} ops={ops} />
        </>
      )}

      {/* Undo the last lifecycle event for the SELECTED lifecycle */}
      <BacktestUndoButton
        backtestId={backtest.id}
        events={events}
        lifecycleId={selectedLifecycleId ?? ""}
      />
    </div>
  )
}
