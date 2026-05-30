import type { CalcInput } from '../types'

export type StrategyResult = {
  strategyId: string
  label: string
  description: string
  kind: 'deterministic' | 'stochastic'
  applicable: boolean
  notApplicableReason?: string
  // probabilities
  pPass: number    // same semantics as CalcResult.pTotal
  pEval: number    // ∏ pPhase of non-funded phases (shared across runners)
  pFunded: number  // pPass / pEval, or 0 if pEval === 0
  // payout (GROSS withdrawal, same formula as CalcResult.w)
  expectedPayout: number
  payoutP5: number
  payoutP50: number
  payoutP95: number
  payoutStdDev: number
  // conditional payout distribution (only over passing iterations)
  // for deterministic strategies both equal expectedPayout
  payoutP5IfPass: number
  payoutP95IfPass: number
  // money (NET — same semantics as CalcResult.ev)
  evNetOfFees: number
}

export type StrategyOptions = {
  seed?: number        // default DEFAULT_SEED (42)
  iterations?: number  // default DEFAULT_ITERATIONS (10_000)
}

export type StrategyRunner = {
  id: string                       // stable, e.g. 'analytic' | 'mc-cushion'
  label: string
  kind: 'deterministic' | 'stochastic'
  run(input: CalcInput, options?: StrategyOptions): StrategyResult
}
