import type { Tables } from "@/types/database"

// ---------------------------------------------------------------------------
// Live balance tracker — domain types (backtest-balance change)
// ---------------------------------------------------------------------------

export type Phase = 'eval' | 'funded'

/** A single trade with a signed P&L. Order within TradingDay.trades is significant. */
export type Trade = { id: string; pnl: number }

/** An ordered trading day containing ordered trades.
 *  `withdrawal` (funded phase only): payout amount taken at end of this day.
 *  Applying a withdrawal closes the current payout period and opens a new one. */
export type TradingDay = { id: string; date?: string; trades: Trade[]; withdrawal?: number }

/** Rule columns from the DB (camelCase mirror). All four CORE fields are required
 *  together; optional add-ons may be null independently.
 *  Min-profit pairs are symmetric per phase: days ⇔ amount (both or neither). */
export type AccountRules = {
  startingBalance: number
  ddAmount: number
  ddType: 'EOD' | 'Intraday'
  evalProfitTarget: number
  evalConsistencyPct: number | null
  evalMinProfitDays: number | null
  evalMinProfitAmount: number | null
  fundedConsistencyPct: number | null
  fundedMinProfitDays: number | null
  fundedMinProfitAmount: number | null
}

/** Running state captured after each trade is applied. */
export type TradeState = {
  tradeId: string
  balance: number
  hwm: number
  threshold: number
  ddBuffer: number
  locked: boolean
  breached: boolean
}

/** End-of-day summary produced by the engine. */
export type DayState = {
  dayId: string
  date?: string
  trades: TradeState[]
  endBalance: number
  dayNet: number
  endThreshold: number
  endBuffer: number
  locked: boolean
  breached: boolean
  /** True when dayNet >= fundedMinProfitAmount (only meaningful when that pair is set). */
  isProfitDay: boolean
}

/** Dynamic consistency result — same math for eval and funded, different gate. */
export type ConsistencyResult = {
  pct: number
  bestWinningDay: number
  currentNetProfit: number
  effectiveTarget: number
  raisedByConsistency: boolean
  /** eval: currentNetProfit >= effectiveTarget; funded: bestWinningDay/currentNetProfit <= pct */
  satisfied: boolean
} | null // null when the relevant pct column is unset

/** Funded-phase live counters (all figures are for the CURRENT payout period). Null in eval phase. */
export type FundedProgress = {
  /** Current period profit = current_balance - period_anchor. */
  periodProfit: number
  /** Count of profit days within the current period only. */
  profitDaysCount: number
  minRequired: number | null
  profitDaysMet: boolean
  withdrawalEligible: boolean
} | null

/** Full result returned by computeAccountState. */
export type AccountState = {
  phase: Phase
  days: DayState[]
  final: {
    balance: number
    threshold: number
    ddBuffer: number
    locked: boolean
    breached: boolean
    breachedAt: { dayId: string; tradeId: string } | null
  }
  consistency: ConsistencyResult
  /** Non-null only when phase === 'eval'. */
  eval: {
    effectiveTarget: number
    passEligible: boolean
    /** Count of eval profit days (dayNet >= evalMinProfitAmount). Undefined when gate not configured. */
    profitDaysCount?: number
    /** Required eval profit days. Undefined when gate not configured. */
    minProfitDaysRequired?: number
    /** True when gate not configured (null pair) OR count >= required. */
    profitDaysMet: boolean
  } | null
  /** Non-null only when phase === 'funded'. */
  funded: FundedProgress
}

/**
 * Map a backtest DB row with complete core rules to the engine's AccountRules type.
 * Asserts that the caller has already verified hasCompleteCore(b).
 */
export function toAccountRules(b: Tables<'backtests'> & {
  dd_starting_balance: number
  dd_amount: number
  dd_type: string
  eval_profit_target: number
}): AccountRules {
  // Supabase returns `numeric` columns as strings at runtime (the generated
  // types say `number`, but the wire format is a string). Coerce every numeric
  // rule to a real number, mirroring how the detail page treats bankroll_initial.
  const num = (v: number | string | null): number | null =>
    v === null ? null : Number(v)
  return {
    startingBalance: Number(b.dd_starting_balance),
    ddAmount: Number(b.dd_amount),
    ddType: b.dd_type as 'EOD' | 'Intraday',
    evalProfitTarget: Number(b.eval_profit_target),
    evalConsistencyPct: num(b.eval_consistency_pct),
    evalMinProfitDays: num(b.eval_min_profit_days),
    evalMinProfitAmount: num(b.eval_min_profit_amount),
    fundedConsistencyPct: num(b.funded_consistency_pct),
    fundedMinProfitDays: num(b.funded_min_profit_days),
    fundedMinProfitAmount: num(b.funded_min_profit_amount),
  }
}

/** Type guard: backtest has all four CORE rule columns set. */
export function hasCompleteCore(
  b: Tables<'backtests'>,
): b is Tables<'backtests'> & {
  dd_starting_balance: number
  dd_amount: number
  dd_type: string
  eval_profit_target: number
} {
  return (
    b.dd_starting_balance !== null &&
    b.dd_amount !== null &&
    b.dd_type !== null &&
    b.eval_profit_target !== null
  )
}

export type Backtest = Tables<"backtests">
export type BacktestEvent = Tables<"backtest_events">
export type BacktestEventType = "E" | "F" | "P"

// Lifecycle status — Amendment 1 vocabulary (overrides design's outcome names)
// - open                : last lifecycle, only E (not yet funded)
// - funded_active       : last lifecycle, E + F but no P yet (funded, awaiting payout)
// - lost                : closed lifecycle, no F (another E followed)
// - breached_no_payout  : has F, but breached by next E with zero P events
// - funded_paid         : has F AND at least one P event
export type LifecycleStatus =
  | "open"
  | "funded_active"
  | "lost"
  | "breached_no_payout"
  | "funded_paid"

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
  counts: {
    E: number
    F: number
    P: number
    paidFunded: number // funded lifecycles with ≥1 payout (subset of F)
  }
  rates: {
    funded: number // F/E
    payout: number // paidFunded/F
    success: number // paidFunded/E
    payoutProbability: number // P/E — probability of a payout event per evaluation
  }
  worstStreak: number
  payoutsTotal: number
  payoutsMean: number
  payoutsMedian: number // median amount across all P events
  payoutsPerFunded: number // mean payout events per funded account (P/F)
  bankrollInitial: number
  evalsSpend: number
  netProfit: number
  bankrollCurrent: number
  roi: number
  isGameOver: boolean // Amendment 2: bankrollCurrent <= 0
}
