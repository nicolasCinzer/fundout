import type { Backtest, BacktestEvent } from "../types"

export type BankrollPoint = {
  step: number // 0 = initial, then 1..N for each event
  bankroll: number
  event: "E" | "F" | "P" | null // null only for step 0
}

/**
 * Pure O(n) walk that produces a step-by-step bankroll curve.
 * Step 0 is the starting bankroll; each subsequent step applies one event.
 */
export function computeBankrollCurve(
  events: BacktestEvent[],
  backtest: Pick<Backtest, "bankroll_initial" | "eval_cost">,
): BankrollPoint[] {
  const initial = Number(backtest.bankroll_initial)
  const evalCost = Number(backtest.eval_cost)
  const points: BankrollPoint[] = [{ step: 0, bankroll: initial, event: null }]

  let running = initial
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    if (ev.type === "E") running -= evalCost
    else if (ev.type === "P") running += Number(ev.amount ?? 0)
    // F: no change
    points.push({ step: i + 1, bankroll: running, event: ev.type as "E" | "F" | "P" })
  }

  return points
}
