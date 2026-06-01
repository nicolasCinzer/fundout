export type BankrollMcInput = {
  bankroll: number
  cost: number
  payoutProb: number // (0, 1) open interval
  payoutNet: number // net payout amount when a winning attempt occurs
  targetBankroll?: number // optional; if present must be > bankroll
}

/** Per-index percentile band. Length === MAX_ATTEMPTS + 1. Null when no alive runs at that index. */
export type PercentileBand = (number | null)[]

export type MetricsPanel = {
  ruinRate: number // ruined_runs / total_runs
  avgFinalBankroll: number // mean of final bankroll value at each run's termination index
  p10FinalBankroll: number // p10 of final bankroll across all runs
  p50FinalBankroll: number // p50 of final bankroll across all runs
  p90FinalBankroll: number // p90 of final bankroll across all runs
  avgAttemptsToRuin: number // mean attempt index at ruin, over ruined runs only; 0 when no ruined runs
  avgPayoutsCollected: number // mean payout count across all runs
  evPerAttempt: number // closed-form: -cost + payoutProb * payoutNet
  avgMaxDrawdownPct: number // avg over runs of max((peak - trough_after_peak) / peak)
  pReachTarget: number // fraction of runs reaching targetBankroll; 0 when no target provided
  survivalRate: number // fraction of runs that reach MAX_ATTEMPTS alive
  maxAttemptsHeuristic: number // floor(bankroll / cost) — max attempts with no payouts
  simCount: number // ITERATIONS constant (10000)
}

export type BankrollMcResult = MetricsPanel & {
  percentileP10: PercentileBand // length MAX_ATTEMPTS + 1
  percentileP50: PercentileBand
  percentileP90: PercentileBand
}
