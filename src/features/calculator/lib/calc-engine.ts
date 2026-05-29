import type { CalcInput, CalcResult, PhaseInput, PhaseResult, Strategy } from '../types'

/**
 * Decides the optimal strategy and returns the per-day target array.
 * Priority: consistency → min-days → single-shot.
 */
export function computeStrategy(phase: PhaseInput): {
  strategy: Strategy
  days: number
  dailyTargets: number[]
} {
  const { dd, objective, consistencyPct, minDays, minProfit } = phase

  // Branch 1: consistency strategy
  if (consistencyPct !== undefined) {
    const dailyTarget = objective * consistencyPct
    const days = Math.ceil(objective / dailyTarget)
    return {
      strategy: 'consistency',
      days,
      dailyTargets: Array(days).fill(dailyTarget),
    }
  }

  // Branch 2: min-days strategy
  if (minDays !== undefined && minProfit !== undefined) {
    if (minDays === 1) {
      return {
        strategy: 'min-days',
        days: 1,
        dailyTargets: [dd],
      }
    }

    const targets: number[] = [dd]
    for (let i = 1; i < minDays - 1; i++) {
      targets.push(minProfit)
    }

    // Check for gap: dd + (minDays−1)×minProfit < objective
    const sumWithoutLastDay = dd + (minDays - 2) * minProfit
    const naturalLastDay = minProfit
    const naturalTotal = sumWithoutLastDay + naturalLastDay

    if (naturalTotal < objective) {
      // Gap adjustment: last day closes the remaining gap
      targets.push(objective - sumWithoutLastDay)
    } else {
      // Overshoot or exact: accepted as-is
      targets.push(minProfit)
    }

    return {
      strategy: 'min-days',
      days: minDays,
      dailyTargets: targets,
    }
  }

  // Branch 3: single-shot strategy
  return {
    strategy: 'single-shot',
    days: 1,
    dailyTargets: [objective],
  }
}

/**
 * Simulates the drawdown floor day-by-day along the optimal success path
 * (every prior day's target hit exactly). Returns ddEffective per day.
 *
 * `ddFixed` lock logic (applies to ddType 'eod' and future 'trailing'; ignored for 'static'):
 *   - Pre-lock (cumulativeProfit_atStartOfDay < dd): behaves as the base type
 *   - Post-lock (cumulativeProfit_atStartOfDay >= dd): floor permanently locked at
 *     phaseStartBalance → ddEffective = cumulativeProfit_atStartOfDay
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
      // 'trailing' — currently unsupported, fall back to eod semantics
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
 * Main entry point. Computes full probability + financial metrics for a multi-phase evaluation.
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
    })
  }

  // pEval: product of non-funded phases only
  const pEval = phaseResults.reduce((acc, r, i) => {
    return phases[i].isFunded ? acc : acc * r.pPhase
  }, 1)

  // pTotal: product of all phases
  const pTotal = phaseResults.reduce((acc, r) => acc * r.pPhase, 1)

  // W: payout from the funded phase
  const fundedPhase = phases.find((p) => p.isFunded)
  const fundedResult = phaseResults.find((_, i) => phases[i].isFunded)
  const w = fundedPhase && fundedResult
    ? fundedPhase.objective * (fundedPhase.payoutCapPct ?? 0) * (fundedPhase.splitPct ?? 0)
    : 0

  const ev = pTotal * w - cEval - pEval * cActivation
  const roi = cEval === 0 ? null : ev / cEval

  return {
    pEval,
    pTotal,
    w,
    ev,
    roi,
    phases: phaseResults,
  }
}
