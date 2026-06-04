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

  for (const ev of events) {
    if (ev.type === "E") countE++
    else if (ev.type === "F") countF++
    else if (ev.type === "P") {
      countP++
      payoutsTotal += Number(ev.amount ?? 0)
    }
  }

  // --- Lifecycles (used for worstStreak and successful-funded count) ---
  const lifecycles = groupLifecycles(events)

  // Successful funded = lifecycles that produced at least one payout.
  // % Success = successful-funded / evaluations (NOT count(P) / count(E),
  // since one funded account can produce many payouts).
  const successfulFunded = lifecycles.filter((lc) => lc.status === "funded_paid").length

  // --- Rates (guard zero-div) ---
  const rates = {
    funded: countE > 0 ? countF / countE : 0,
    payout: countF > 0 ? countP / countF : 0,
    success: countE > 0 ? successfulFunded / countE : 0,
  }

  // --- Payout mean ---
  const payoutsMean = countP > 0 ? payoutsTotal / countP : 0

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
    counts: { E: countE, F: countF, P: countP },
    rates,
    worstStreak,
    payoutsTotal,
    payoutsMean,
    bankrollInitial,
    evalsSpend,
    netProfit,
    bankrollCurrent,
    roi,
    isGameOver,
  }
}
