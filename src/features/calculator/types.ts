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
}

export type CalcInput = {
  cEval: number
  cActivation: number
  phases: PhaseInput[]
}

export type PhaseResult = {
  pPhase: number
  strategy: Strategy
  days: number
  /** Per-day target array, length = days. Day 1 at index 0. */
  dailyTargets: number[]
  /** Per-day effective drawdown floor, length = days. Used for audit + UI debug if needed. */
  ddEffective: number[]
}

export type CalcResult = {
  pEval: number          // ∏ pPhase where !isFunded
  pTotal: number         // ∏ pPhase (all phases)
  w: number              // objective_funded × payoutCapPct × splitPct, or 0 if no funded phase
  ev: number             // pTotal·w − cEval − pEval·cActivation
  roi: number | null     // ev / cEval, or null when cEval === 0
  phases: PhaseResult[]
}
