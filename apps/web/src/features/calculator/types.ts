export type DDType = 'static' | 'eod' | 'trailing'
export type Strategy = 'consistency' | 'min-days' | 'single-shot'

export type PhaseInput = {
  dd: number
  objective: number
  ddType: DDType
  /** Locks the floor at phaseStartBalance once cumulativeProfit ≥ dd. Ignored when ddType === 'static'. */
  ddFixed: boolean
  isFunded: boolean
  consistencyPct?: number
  minDays?: number
  minProfit?: number
  payoutCapPct?: number
  splitPct?: number
  /** Minimum payout the propfirm allows to be requested. If computed payout < this, withdrawal is $0. Funded phase only. */
  minPayoutRequest?: number
}

export type CalcInput = {
  cEval: number
  cActivation: number
  phases: PhaseInput[]
}

export type CushionParams = {
  day1Risk: number     // dd risked on day 1
  day1Target: number   // objective targeted on day 1
  betSize: number      // ±minProfit coin-flip size per subsequent day
  profitDays: number   // minDays required to lock pass
}

export type PhaseResult = {
  pPhase: number
  strategy: Strategy
  days: number
  /** Per-day target array, length = days. Day 1 at index 0. */
  dailyTargets: number[]
  /** Per-day effective drawdown floor, length = days. Used for audit + UI debug if needed. */
  ddEffective: number[]
  /** True for the funded phase. */
  isFunded: boolean
  /** Cushion mechanics summary. Present only when MC cushion ran for this phase. */
  cushion?: CushionParams
}

/**
 * Monte Carlo stats for the funded phase, modelling cushion mechanics +
 * geometric repeat payouts. Present only when funded phase has minDays/minProfit set.
 */
export type McStats = {
  /** Single-cycle expected gross payout (mean over passing iterations). */
  expectedPayout: number
  payoutP5: number
  payoutP50: number
  payoutP95: number
  payoutStdDev: number
  payoutP5IfPass: number
  payoutP50IfPass: number
  payoutP95IfPass: number
  /** Expected number of payouts over a propfirm lifetime, = 1 / (1 − pFunded). */
  repeatMultiplier: number
  /** Lifetime expected payout = expectedPayout × repeatMultiplier. */
  lifetimePayout: number
}

export type CalcResult = {
  pEval: number          // ∏ pPhase where !isFunded
  pTotal: number         // pEval × pFunded (funded pPhase comes from MC when applicable)
  /** Per-cycle expected payout (MC's expectedPayout when applicable, else analytic). */
  w: number
  /** Lifetime EV: pTotal × w × repeatMultiplier − cEval − pEval × cActivation. */
  ev: number
  roi: number | null     // ev / cEval, or null when cEval === 0
  phases: PhaseResult[]
  /** MC simulation stats. Null when funded phase doesn't have cushion mechanics. */
  mc: McStats | null
}
