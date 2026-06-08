import type { Backtest, BacktestEvent, BacktestStats } from "../types"
import { groupLifecycles } from "./group-lifecycles"

/**
 * Pure function. O(n) — derives all stats from the event log.
 *
 * Amendment 1: worstStreak uses lifecycle-status algorithm (not a simple
 * consecutive-E counter). Scans lifecycles for the longest contiguous run
 * of "lost" or "breached_no_payout" statuses. "funded_paid" breaks the streak.
 * "open" (the tail lifecycle) is skipped entirely.
 *
 * Amendment 2: isGameOver = bankrollCurrent <= 0.
 */
export function computeStats(
  events: BacktestEvent[],
  backtest: Pick<Backtest, "bankroll_initial" | "eval_cost">,
): BacktestStats {
  const bankrollInitial = Number(backtest.bankroll_initial)
  const evalCost = Number(backtest.eval_cost)

  // --- Counts pass ---
  let countE = 0
  let countF = 0
  let countP = 0
  let payoutsTotal = 0
  const payoutAmounts: number[] = []

  for (const ev of events) {
    if (ev.type === "E") countE++
    else if (ev.type === "F") countF++
    else if (ev.type === "P") {
      countP++
      const amt = Number(ev.amount ?? 0)
      payoutsTotal += amt
      payoutAmounts.push(amt)
    }
  }

  // --- Lifecycles (used for worstStreak and successful-funded count) ---
  const lifecycles = groupLifecycles(events)

  // Successful funded = lifecycles that produced at least one payout.
  // % Success = successful-funded / evaluations (NOT count(P) / count(E),
  // since one funded account can produce many payouts).
  const successfulFunded = lifecycles.filter((lc) => lc.status === "funded_paid").length

  // --- Rates (guard zero-div) ---
  // payout = funded lifecycles that produced ≥1 payout / funded lifecycles.
  // Bounded to [0, 1]: a single funded account can produce many payout events,
  // so countP/countF can exceed 100% — use successfulFunded/countF instead.
  // payoutProbability = raw P events / evaluations. NOT bounded to [0, 1] —
  // a funded account producing many payouts can push this above 100% (by design,
  // it's an expected-payouts-per-eval metric, not a probability in the strict sense).
  const rates = {
    funded: countE > 0 ? countF / countE : 0,
    payout: countF > 0 ? successfulFunded / countF : 0,
    success: countE > 0 ? successfulFunded / countE : 0,
    payoutProbability: countE > 0 ? countP / countE : 0,
  }

  // --- Payout aggregates ---
  const payoutsMean = countP > 0 ? payoutsTotal / countP : 0
  const payoutsMedian = median(payoutAmounts)
  const payoutsPerFunded = countF > 0 ? countP / countF : 0

  // --- Financial ---
  const evalsSpend = countE * evalCost
  const netProfit = payoutsTotal - evalsSpend
  const bankrollCurrent = bankrollInitial + netProfit
  const roi = bankrollInitial > 0 ? netProfit / bankrollInitial : 0

  // --- Worst streak (Amendment 1: lifecycle-status based) ---
  let worstStreak = 0
  let currentStreak = 0

  for (const lc of lifecycles) {
    if (lc.status === "open" || lc.status === "funded_active") {
      // Skip in-progress lifecycles — not yet resolved, neither extend nor break the streak
      continue
    }
    if (lc.status === "lost" || lc.status === "breached_no_payout") {
      currentStreak++
      if (currentStreak > worstStreak) worstStreak = currentStreak
    } else {
      // funded_paid — breaks the streak
      currentStreak = 0
    }
  }

  // --- Game over (Amendment 2) ---
  const isGameOver = bankrollCurrent <= 0

  return {
    counts: { E: countE, F: countF, P: countP, paidFunded: successfulFunded },
    rates,
    worstStreak,
    payoutsTotal,
    payoutsMean,
    payoutsMedian,
    payoutsPerFunded,
    bankrollInitial,
    evalsSpend,
    netProfit,
    bankrollCurrent,
    roi,
    isGameOver,
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}
