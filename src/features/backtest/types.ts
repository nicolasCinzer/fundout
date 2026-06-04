import type { Tables } from "@/types/database"

export type Backtest = Tables<"backtests">
export type BacktestEvent = Tables<"backtest_events">
export type BacktestEventType = "E" | "F" | "P"

// Lifecycle status — Amendment 1 vocabulary (overrides design's outcome names)
// - open            : last lifecycle, still in-progress
// - lost            : closed lifecycle, no F (another E followed)
// - blown_no_payout : has F, but blown by next E with zero P events
// - funded_paid     : has F AND at least one P event
export type LifecycleStatus = "open" | "lost" | "blown_no_payout" | "funded_paid"

// Derived view type produced by group-lifecycles.ts
export type Lifecycle = {
  index: number // 1-based
  startPosition: number // position of the E event that opened this lifecycle
  evalEvent: BacktestEvent
  fundedEvent: BacktestEvent | null
  payouts: BacktestEvent[]
  status: LifecycleStatus // Amendment 1: replaces design's "outcome" field
  payoutsTotal: number
}

// Stats output from compute-stats.ts
export type BacktestStats = {
  counts: { E: number; F: number; P: number }
  rates: { funded: number; payout: number; success: number } // F/E, P/F, P/E
  worstStreak: number
  payoutsTotal: number
  payoutsMean: number
  bankrollInitial: number
  evalsSpend: number
  netProfit: number
  bankrollCurrent: number
  roi: number
  isGameOver: boolean // Amendment 2: bankrollCurrent <= 0
}
