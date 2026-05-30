import { computeStrategy, simulateDDFloor, pPhase } from '../lib/calc-engine'
import type { CalcInput } from '../types'
import { DEFAULT_ITERATIONS, DEFAULT_SEED, mulberry32 } from './prng'
import type { StrategyOptions, StrategyResult, StrategyRunner } from './types'

const NOT_APPLICABLE_REASON =
  'MC-Cushion only applies to funded phases with a minimum trading days constraint.'

function computePEval(input: CalcInput): number {
  const nonFunded = input.phases.filter((p) => !p.isFunded)
  if (nonFunded.length === 0) return 1
  return nonFunded.reduce((acc, phase) => {
    const { dailyTargets } = computeStrategy(phase)
    const ddEff = simulateDDFloor(phase, dailyTargets)
    return acc * pPhase(dailyTargets, ddEff)
  }, 1)
}

function runMcCushion(input: CalcInput, options?: StrategyOptions): StrategyResult {
  const seed = options?.seed ?? DEFAULT_SEED
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS

  const funded = input.phases.find((p) => p.isFunded)

  const notApplicable = (reason: string): StrategyResult => ({
    strategyId: 'mc-cushion',
    label: 'MC Cushion',
    description:
      'Monte Carlo simulation of the funded phase using a seeded PRNG. Models day-1 cushion mechanics and min-profit win streaks.',
    kind: 'stochastic',
    applicable: false,
    notApplicableReason: reason,
    pPass: 0,
    pEval: 0,
    pFunded: 0,
    expectedPayout: 0,
    payoutP5: 0,
    payoutP50: 0,
    payoutP95: 0,
    payoutStdDev: 0,
    payoutP5IfPass: 0,
    payoutP95IfPass: 0,
    evNetOfFees: 0,
  })

  if (!funded) {
    return notApplicable(NOT_APPLICABLE_REASON)
  }

  const { dd, objective, minDays, minProfit, payoutCapPct, splitPct, minPayoutRequest } = funded
  const minPayout = minPayoutRequest ?? 0

  if (
    minDays === undefined ||
    minProfit === undefined ||
    minProfit <= 0 ||
    dd <= 0 ||
    objective <= 0
  ) {
    return notApplicable(NOT_APPLICABLE_REASON)
  }

  const pEval = computePEval(input)

  // Fresh PRNG instance per run — determinism contract
  const rng = mulberry32(seed)

  // Day-1 trade: risk = dd, target = objective.
  // Under fair-coin underlying, P(reach +target before -risk) = risk / (risk + target).
  // pWinDay1 reduces to 0.5 when objective === dd (original 1:1 case).
  const pWinDay1 = dd / (dd + objective)

  const payouts: number[] = new Array(iterations)

  for (let i = 0; i < iterations; i++) {
    // Day 1: win → cushion = objective; lose → blown
    if (rng() >= pWinDay1) {
      payouts[i] = 0
      continue
    }

    // Day-1 win counts as 1 min-profit day (profit ≥ min_profit trivially).
    // Cushion = objective: trailing DD floor locks at initial_balance once
    // equity ≥ initial + dd, and stays there regardless of further profit.
    let equity = objective  // track relative to initial balance = 0
    let cushion = objective
    let winDays = 1
    let blown = false

    // Days 2..∞: each bet ±minProfit until winDays >= minDays or blown
    while (winDays < minDays) {
      if (rng() < 0.5) {
        // win
        equity += minProfit
        cushion += minProfit
        winDays++
      } else {
        // lose
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

  // Aggregate
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

  // Percentiles and stdDev of full vector (zeros included)
  const sorted = [...payouts].sort((a, b) => a - b)
  const p5 = sorted[Math.floor((iterations - 1) * 0.05)] ?? 0
  const p50 = sorted[Math.floor((iterations - 1) * 0.5)] ?? 0
  const p95 = sorted[Math.floor((iterations - 1) * 0.95)] ?? 0

  // Conditional percentiles — only the passing iterations
  const passSorted = sorted.filter((p) => p > 0)
  const p5IfPass = passSorted.length > 0
    ? passSorted[Math.floor((passSorted.length - 1) * 0.05)] ?? 0
    : 0
  const p95IfPass = passSorted.length > 0
    ? passSorted[Math.floor((passSorted.length - 1) * 0.95)] ?? 0
    : 0

  const mean = passSum / iterations  // = pFunded × expectedPayout
  let varianceSum = 0
  for (let i = 0; i < iterations; i++) {
    const diff = payouts[i] - mean
    varianceSum += diff * diff
  }
  const payoutStdDev = Math.sqrt(varianceSum / iterations)

  const pPass = pEval * pFunded
  const cEval = input.cEval ?? 0
  const cActivation = input.cActivation ?? 0
  const evNetOfFees = pPass * expectedPayout - cEval - pEval * cActivation

  return {
    strategyId: 'mc-cushion',
    label: 'MC Cushion',
    description:
      'Monte Carlo simulation of the funded phase using a seeded PRNG. Models day-1 cushion mechanics and min-profit win streaks.',
    kind: 'stochastic',
    applicable: true,
    pPass,
    pEval,
    pFunded,
    expectedPayout,
    payoutP5: p5,
    payoutP50: p50,
    payoutP95: p95,
    payoutStdDev,
    payoutP5IfPass: p5IfPass,
    payoutP95IfPass: p95IfPass,
    evNetOfFees,
  }
}

export const mcCushionRunner: StrategyRunner = {
  id: 'mc-cushion',
  label: 'MC Cushion',
  kind: 'stochastic',
  run: runMcCushion,
}
