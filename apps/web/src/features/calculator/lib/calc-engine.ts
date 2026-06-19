import type { CalcInput, CalcResult, PhaseInput, PhaseResult, Strategy } from '../types'
import { simulateMcCushion } from './mc-cushion'

/**
 * Decides the optimal strategy and returns the per-day target array.
 * Priority: consistency → min-days → single-shot.
 */
export function computeStrategy(phase: PhaseInput): {
  strategy: Strategy
  days: number
  dailyTargets: number[]
} {
  const { objective, consistencyPct, minDays, minProfit } = phase

  // Branch 1: consistency strategy
  if (consistencyPct !== undefined) {
    const cap = objective * consistencyPct
    const days = Math.ceil(objective / cap)
    const targets: number[] = []
    let remaining = objective
    for (let i = 0; i < days; i++) {
      const target = Math.min(cap, remaining)
      targets.push(target)
      remaining -= target
    }
    return {
      strategy: 'consistency',
      days,
      dailyTargets: targets,
    }
  }

  // Branch 2: min-days strategy
  if (minDays !== undefined && minProfit !== undefined) {
    const floor = minDays * minProfit
    const extra = objective - floor

    const targets: number[] =
      extra > 0
        ? [minProfit + extra, ...Array(minDays - 1).fill(minProfit)]
        : Array(minDays).fill(minProfit)

    return {
      strategy: 'min-days',
      days: minDays,
      dailyTargets: targets,
    }
  }

  // Branch 3: single-shot fallback — only used by eval phases without flags.
  // Funded phases always use cushion mechanics (see calculate()).
  return {
    strategy: 'single-shot',
    days: 1,
    dailyTargets: [objective],
  }
}

/**
 * Simulates the drawdown floor day-by-day along the optimal success path.
 */
export function simulateDDFloor(
  phase: PhaseInput,
  dailyTargets: number[]
): number[] {
  const { dd, ddType, ddFixed } = phase
  const ddEffective: number[] = []

  let cumulativeProfit = 0
  let locked = false

  for (let i = 0; i < dailyTargets.length; i++) {
    if (!locked && cumulativeProfit >= dd) {
      locked = true
    }

    if (ddType === 'static') {
      ddEffective.push(dd + cumulativeProfit)
    } else if (ddType === 'eod') {
      if (ddFixed && locked) {
        ddEffective.push(cumulativeProfit)
      } else {
        ddEffective.push(dd)
      }
    } else {
      if (ddFixed && locked) {
        ddEffective.push(cumulativeProfit)
      } else {
        ddEffective.push(dd)
      }
    }

    cumulativeProfit += dailyTargets[i]
  }

  return ddEffective
}

/**
 * Computes phase probability as product of per-day probabilities.
 * pDay_i = ddEffective_i / (ddEffective_i + dailyTargets_i)
 */
export function pPhase(
  dailyTargets: number[],
  ddEffective: number[]
): number {
  let product = 1
  for (let i = 0; i < dailyTargets.length; i++) {
    product *= ddEffective[i] / (ddEffective[i] + dailyTargets[i])
  }
  return product
}

/**
 * Main entry point. Funded phase uses Monte Carlo cushion mechanics when
 * minDays + minProfit are set; falls back to analytic otherwise. Eval phases
 * always use the analytic per-day formula.
 *
 * Lifetime EV applies the geometric repeat-payout multiplier 1 / (1 − pFunded),
 * since the funded cushion can be re-cycled with the same per-attempt odds.
 */
export function calculate(input: CalcInput): CalcResult {
  const { cEval, cActivation, phases } = input
  const phaseResults: PhaseResult[] = []

  for (const phase of phases) {
    const { strategy, days, dailyTargets } = computeStrategy(phase)
    const ddEff = simulateDDFloor(phase, dailyTargets)
    const p = pPhase(dailyTargets, ddEff)

    phaseResults.push({
      pPhase: p,
      strategy,
      days,
      dailyTargets,
      ddEffective: ddEff,
      isFunded: phase.isFunded,
    })
  }

  // Run MC for the funded phase (if any has cushion mechanics) and use its
  // pFunded / expectedPayout to override the analytic values.
  const fundedIdx = phases.findIndex((p) => p.isFunded)
  const fundedPhase = fundedIdx >= 0 ? phases[fundedIdx] : null
  const mcResult = fundedPhase ? simulateMcCushion(fundedPhase) : null

  if (mcResult && fundedIdx >= 0 && fundedPhase) {
    phaseResults[fundedIdx] = {
      ...phaseResults[fundedIdx],
      pPhase: mcResult.pFunded,
      cushion: {
        day1Risk: fundedPhase.dd,
        day1Target: fundedPhase.objective,
        betSize: fundedPhase.minProfit ?? 0,
        profitDays: fundedPhase.minDays ?? 0,
      },
    }
  }

  const pEval = phaseResults.reduce((acc, r, i) => {
    return phases[i].isFunded ? acc : acc * r.pPhase
  }, 1)

  const pTotal = phaseResults.reduce((acc, r) => acc * r.pPhase, 1)

  // Per-cycle expected payout.
  let w: number
  if (mcResult) {
    w = mcResult.expectedPayout
  } else if (fundedPhase) {
    const rawW =
      fundedPhase.objective * (fundedPhase.payoutCapPct ?? 0) * (fundedPhase.splitPct ?? 0)
    const minPayoutRequest = fundedPhase.minPayoutRequest ?? 0
    w = rawW < minPayoutRequest ? 0 : rawW
  } else {
    w = 0
  }

  // Lifetime repeat multiplier — geometric series 1 / (1 − pRepeat) where
  // pRepeat is the probability of completing a *subsequent* cushion cycle.
  //
  // Cycle 2+ has different mechanics than cycle 1: after a payout the trader
  // keeps cushion = (1 − cap) × objective above the locked DD floor, and needs
  // to recover (cap × objective) to retrigger payout. So:
  //
  //   day-1 risk : target = (1 − cap)·obj : cap·obj  →  P(win) = 1 − cap
  //
  // Multiply by the probability of surviving the min-profit random walk
  // (= pFunded / pWinDay1_cycle1 = pFunded × (dd + obj) / dd, capped at 1).
  let repeatMultiplier = 1
  if (mcResult && fundedPhase && mcResult.pFunded > 0) {
    const cap = fundedPhase.payoutCapPct ?? 0
    const pWinDay1Cycle1 = fundedPhase.dd / (fundedPhase.dd + fundedPhase.objective)
    const pSurviveMinDays = Math.min(1, mcResult.pFunded / pWinDay1Cycle1)
    const pRepeat = (1 - cap) * pSurviveMinDays
    repeatMultiplier = Math.min(1 / Math.max(1 - pRepeat, 0.01), 100)
  }
  const lifetimePayout = w * repeatMultiplier

  const ev = pTotal * lifetimePayout - cEval - pEval * cActivation
  const roi = cEval === 0 ? null : ev / cEval

  const mc = mcResult
    ? {
        expectedPayout: mcResult.expectedPayout,
        payoutP5: mcResult.payoutP5,
        payoutP50: mcResult.payoutP50,
        payoutP95: mcResult.payoutP95,
        payoutStdDev: mcResult.payoutStdDev,
        payoutP5IfPass: mcResult.payoutP5IfPass,
        payoutP50IfPass: mcResult.payoutP50IfPass,
        payoutP95IfPass: mcResult.payoutP95IfPass,
        repeatMultiplier,
        lifetimePayout,
      }
    : null

  return {
    pEval,
    pTotal,
    w,
    ev,
    roi,
    phases: phaseResults,
    mc,
  }
}
