import type { PhaseInput } from '../types'
import { DEFAULT_ITERATIONS, DEFAULT_SEED, mulberry32 } from './prng'

export type McSimOptions = {
  seed?: number
  iterations?: number
}

export type McSimResult = {
  /** Probability of successfully completing one funded cycle (passing + receiving payout). */
  pFunded: number
  /** Expected payout amount, conditional on the cycle being successful. */
  expectedPayout: number
  /** Percentiles of the FULL payout vector (zeros included). */
  payoutP5: number
  payoutP50: number
  payoutP95: number
  /** Std deviation of the full payout vector. */
  payoutStdDev: number
  /** Conditional percentiles — only over successful cycles. */
  payoutP5IfPass: number
  payoutP50IfPass: number
  payoutP95IfPass: number
}

/**
 * Simulate one funded-phase cushion cycle via Monte Carlo.
 *
 * Mechanics:
 *  - Day 1: stop-loss at the full DD, take-profit at the funded objective.
 *    P(win day 1) = dd / (dd + objective). Win → cushion equal to the objective;
 *    lose → account blown ($0 payout for this iteration).
 *  - Days 2..N: each min-profit day is a fair-coin ±minProfit step until
 *    `winDays >= minDays` or cushion exhausted.
 *  - On pass: gross = min(equity × payoutCapPct, equity) × splitPct.
 *  - minPayoutRequest floor zeros payouts below the threshold.
 *
 * Returns `null` if the funded phase is missing the parameters required by
 * the cushion mechanics (minDays, minProfit, valid dd/objective).
 */
export function simulateMcCushion(
  funded: PhaseInput,
  options?: McSimOptions,
): McSimResult | null {
  const { dd, objective, minDays, minProfit, payoutCapPct, splitPct, minPayoutRequest } = funded
  const minPayout = minPayoutRequest ?? 0

  if (
    minDays === undefined ||
    minProfit === undefined ||
    minProfit <= 0 ||
    dd <= 0 ||
    objective <= 0
  ) {
    return null
  }

  const seed = options?.seed ?? DEFAULT_SEED
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS

  const rng = mulberry32(seed)
  const pWinDay1 = dd / (dd + objective)
  const payouts: number[] = new Array(iterations)

  for (let i = 0; i < iterations; i++) {
    if (rng() >= pWinDay1) {
      payouts[i] = 0
      continue
    }

    // Day-1 win counts as 1 min-profit day; cushion = objective
    let equity = objective
    let cushion = objective
    let winDays = 1
    let blown = false

    while (winDays < minDays) {
      if (rng() < 0.5) {
        equity += minProfit
        cushion += minProfit
        winDays++
      } else {
        equity -= minProfit
        cushion -= minProfit
        if (cushion < 0) {
          blown = true
          break
        }
      }
    }

    if (blown) {
      payouts[i] = 0
    } else {
      const finalProfit = equity
      const gross =
        Math.min(finalProfit * (payoutCapPct ?? 0), finalProfit) * (splitPct ?? 0)
      payouts[i] = gross < minPayout ? 0 : gross
    }
  }

  let passSum = 0
  let passCount = 0
  for (let i = 0; i < iterations; i++) {
    if (payouts[i] > 0) {
      passSum += payouts[i]
      passCount++
    }
  }

  const pFunded = passCount / iterations
  const expectedPayout = passCount > 0 ? passSum / passCount : 0

  const sorted = [...payouts].sort((a, b) => a - b)
  const payoutP5 = sorted[Math.floor((iterations - 1) * 0.05)] ?? 0
  const payoutP50 = sorted[Math.floor((iterations - 1) * 0.5)] ?? 0
  const payoutP95 = sorted[Math.floor((iterations - 1) * 0.95)] ?? 0

  const passSorted = sorted.filter((p) => p > 0)
  const payoutP5IfPass = passSorted.length > 0
    ? passSorted[Math.floor((passSorted.length - 1) * 0.05)] ?? 0
    : 0
  const payoutP50IfPass = passSorted.length > 0
    ? passSorted[Math.floor((passSorted.length - 1) * 0.5)] ?? 0
    : 0
  const payoutP95IfPass = passSorted.length > 0
    ? passSorted[Math.floor((passSorted.length - 1) * 0.95)] ?? 0
    : 0

  const mean = passSum / iterations
  let varianceSum = 0
  for (let i = 0; i < iterations; i++) {
    const diff = payouts[i] - mean
    varianceSum += diff * diff
  }
  const payoutStdDev = Math.sqrt(varianceSum / iterations)

  return {
    pFunded,
    expectedPayout,
    payoutP5,
    payoutP50,
    payoutP95,
    payoutStdDev,
    payoutP5IfPass,
    payoutP50IfPass,
    payoutP95IfPass,
  }
}
