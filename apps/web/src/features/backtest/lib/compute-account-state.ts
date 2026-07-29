import type {
  AccountRules,
  AccountState,
  ConsistencyResult,
  DayState,
  FundedProgress,
  Phase,
  TradeState,
  TradingDay,
} from "../types"

// ---------------------------------------------------------------------------
// computeAccountState
//
// Pure deterministic O(n) function that derives all live DD / consistency /
// funded-withdrawal state from rules + phase + ordered trading days.
//
// Zero I/O, zero side-effects, no external dependencies.
//
// Key invariants:
//  - EOD:      HWM/threshold update ONLY at end-of-day; lock trigger at EOD only.
//  - Intraday: HWM/threshold + lock + breach checked AFTER EVERY trade.
//  - Lock:     balance >= start+ddAmount+100 → locked=true, threshold=start+100 (frozen).
//  - Breach:   balance <= threshold → breached=true permanently (no recovery).
//  - ddBuffer: balance - threshold (may be negative when breached).
//
// Funded payout periods:
//  - A TradingDay with `withdrawal` closes the current period.
//  - period_anchor = startingBalance (P1) or post-withdrawal balance (Pn+1).
//  - period_profit = current_balance - period_anchor.
//  - profit-days + consistency are counted WITHIN the current period only.
//  - DD floor is STATIC across all periods — withdrawals never reset it.
//
// Satisfies: REQ-ENG-01..07, REQ-EOD-01..04, REQ-ITD-01..04
//            REQ-ECON-01..10, REQ-FWG-01..08, REQ-TRANS-04, BOUNDARY-01
//            REQ-EVAL-MINDAYS-01..04, REQ-PERIOD-01..06
// ---------------------------------------------------------------------------

export function computeAccountState(
  rules: AccountRules,
  phase: Phase,
  days: TradingDay[],
): AccountState {
  const { startingBalance, ddAmount, ddType } = rules
  const lockTrigger = startingBalance + ddAmount + 100
  const lockedThreshold = startingBalance + 100

  // Running state
  let balance = startingBalance
  let hwm = startingBalance
  let threshold = startingBalance - ddAmount
  let locked = false
  let breached = false
  let breachedAt: { dayId: string; tradeId: string } | null = null

  const dayStates: DayState[] = []

  // Per-period state (funded phase only)
  // period anchor starts at startingBalance; resets after each withdrawal
  let periodAnchor = startingBalance
  // profit-days within the current period
  let periodProfitDaysCount = 0
  // best winning day within the current period (for per-period consistency)
  let periodBestWinningDay = 0

  for (const tradingDay of days) {
    const tradeStates: TradeState[] = []
    let dayNet = 0

    if (ddType === "EOD") {
      // -----------------------------------------------------------------------
      // EOD mode: HWM + lock deferred to end-of-day; threshold FROZEN during day
      // -----------------------------------------------------------------------
      for (const trade of tradingDay.trades) {
        balance += trade.pnl
        dayNet += trade.pnl

        // Breach check uses the PRE-DAY frozen threshold (threshold not updated mid-day)
        if (!breached && balance <= threshold) {
          breached = true
          breachedAt = { dayId: tradingDay.id, tradeId: trade.id }
        }

        tradeStates.push({
          tradeId: trade.id,
          balance,
          hwm, // HWM not yet updated in EOD mode during the day
          threshold, // frozen threshold
          ddBuffer: balance - threshold,
          locked,
          breached,
        })
      }

      // End-of-day: update HWM + check lock (if not already locked)
      if (!locked && balance > hwm) {
        hwm = balance
        threshold = hwm - ddAmount

        // Lock trigger checked at EOD after HWM update
        if (balance >= lockTrigger) {
          locked = true
          threshold = lockedThreshold
        }
      }
    } else {
      // -----------------------------------------------------------------------
      // Intraday mode: HWM + lock + breach after EVERY trade
      // -----------------------------------------------------------------------
      for (const trade of tradingDay.trades) {
        balance += trade.pnl
        dayNet += trade.pnl

        // Trail HWM upward (never downward)
        if (!locked && balance > hwm) {
          hwm = balance
          threshold = hwm - ddAmount
        }

        // Lock trigger
        if (!locked && balance >= lockTrigger) {
          locked = true
          threshold = lockedThreshold
        }

        // Breach check
        if (!breached && balance <= threshold) {
          breached = true
          breachedAt = { dayId: tradingDay.id, tradeId: trade.id }
        }

        tradeStates.push({
          tradeId: trade.id,
          balance,
          hwm,
          threshold,
          ddBuffer: balance - threshold,
          locked,
          breached,
        })
      }
    }

    // Whether this day qualifies as a profit day for its phase's min-days gate.
    // Eval: dayNet >= evalMinProfitAmount (when pair is set).
    // Funded: dayNet >= fundedMinProfitAmount (when pair is set).
    // null-safe: treat undefined as null (defensive for legacy callers / partial rule objects)
    const isProfitDay =
      phase === "eval"
        ? rules.evalMinProfitAmount != null
          ? dayNet >= rules.evalMinProfitAmount
          : false
        : rules.fundedMinProfitAmount != null
          ? dayNet >= rules.fundedMinProfitAmount
          : false

    dayStates.push({
      dayId: tradingDay.id,
      date: tradingDay.date,
      trades: tradeStates,
      endBalance: balance,
      dayNet,
      endThreshold: threshold,
      endBuffer: balance - threshold,
      locked,
      breached,
      isProfitDay,
    })

    // -------------------------------------------------------------------------
    // Per-period accounting (funded phase only)
    // -------------------------------------------------------------------------
    if (phase === "funded") {
      // Track profit days within the current period
      if (isProfitDay) {
        periodProfitDaysCount++
      }
      // Track best winning day within the current period (only positive days)
      if (dayNet > 0) {
        periodBestWinningDay = Math.max(periodBestWinningDay, dayNet)
      }

      // If this day carries a withdrawal, close the period and open a new one.
      // The withdrawal reduces balance; period anchor resets for the next period.
      // The DD floor (threshold/lock) is NOT reset — it is static for the entire funded account.
      if (tradingDay.withdrawal !== undefined && tradingDay.withdrawal > 0) {
        balance -= tradingDay.withdrawal
        // Update the last DayState's endBalance to reflect the post-withdrawal balance
        const last = dayStates[dayStates.length - 1]
        ;(last as { endBalance: number }).endBalance = balance
        ;(last as { endBuffer: number }).endBuffer = balance - threshold

        // Reset per-period counters for the new period
        periodAnchor = balance
        periodProfitDaysCount = 0
        periodBestWinningDay = 0
      }
    }
  }

  const currentNetProfit = balance - startingBalance

  // -------------------------------------------------------------------------
  // Consistency calculation
  // -------------------------------------------------------------------------
  // For funded: uses current-period figures (bestWinningDay / periodProfit)
  // For eval: uses whole-run figures (bestWinningDay / totalNetProfit)
  const pctForPhase = phase === "eval" ? rules.evalConsistencyPct : rules.fundedConsistencyPct
  let consistency: ConsistencyResult = null

  if (pctForPhase !== null) {
    if (phase === "eval") {
      // Eval consistency: effectiveTarget = max(evalProfitTarget, bestWinningDay / pct)
      const bestWinningDay = dayStates.reduce(
        (best, d) => (d.dayNet > 0 ? Math.max(best, d.dayNet) : best),
        0,
      )
      const base = rules.evalProfitTarget
      const effectiveTarget = bestWinningDay > 0
        ? Math.max(base, bestWinningDay / pctForPhase)
        : base
      const raisedByConsistency = effectiveTarget > base
      const satisfied = currentNetProfit >= effectiveTarget

      consistency = {
        pct: pctForPhase,
        bestWinningDay,
        currentNetProfit,
        effectiveTarget,
        raisedByConsistency,
        satisfied,
      }
    } else {
      // Funded consistency: ratio = periodBestWinningDay / periodProfit <= pct
      // period_profit <= 0 → withdrawal is blocked regardless (period_profit > 0 required);
      // consistency.satisfied=false when period_profit <= 0 (correct: blocks withdrawal)
      const periodProfit = balance - periodAnchor
      if (periodProfit <= 0) {
        consistency = {
          pct: pctForPhase,
          bestWinningDay: periodBestWinningDay,
          currentNetProfit,
          effectiveTarget: 0,
          raisedByConsistency: false,
          satisfied: false, // period_profit <= 0 blocks — no withdrawal possible
        }
      } else {
        const ratio = periodBestWinningDay / periodProfit
        const satisfied = ratio <= pctForPhase

        consistency = {
          pct: pctForPhase,
          bestWinningDay: periodBestWinningDay,
          currentNetProfit,
          effectiveTarget: 0,
          raisedByConsistency: false,
          satisfied,
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Phase-specific outputs
  // -------------------------------------------------------------------------
  let evalResult: AccountState["eval"] = null
  let funded: FundedProgress = null

  if (phase === "eval") {
    const effectiveTarget =
      consistency !== null ? consistency.effectiveTarget : rules.evalProfitTarget

    // Eval min-days gate (treat undefined as null — defensive for legacy callers)
    const hasEvalMinDays = rules.evalMinProfitDays != null && rules.evalMinProfitAmount != null
    const evalProfitDaysCount = hasEvalMinDays
      ? dayStates.filter((d) => d.isProfitDay).length
      : undefined
    const profitDaysMet = hasEvalMinDays
      ? evalProfitDaysCount! >= rules.evalMinProfitDays!
      : true

    const passEligible = !breached && currentNetProfit >= effectiveTarget && profitDaysMet

    evalResult = {
      effectiveTarget,
      passEligible,
      ...(hasEvalMinDays
        ? {
            profitDaysCount: evalProfitDaysCount,
            minProfitDaysRequired: rules.evalMinProfitDays!,
          }
        : {}),
      profitDaysMet,
    }
  } else {
    // Funded phase: per-period profit + profit-days counter + withdrawal eligibility
    const periodProfit = balance - periodAnchor
    const minRequired = rules.fundedMinProfitDays ?? null
    const profitDaysMet = minRequired == null || periodProfitDaysCount >= minRequired
    const consistencyOk = consistency === null || consistency.satisfied
    const withdrawalEligible = !breached && periodProfit > 0 && consistencyOk && profitDaysMet

    funded = {
      periodProfit,
      profitDaysCount: periodProfitDaysCount,
      minRequired,
      profitDaysMet,
      withdrawalEligible,
    }
  }

  return {
    phase,
    days: dayStates,
    final: {
      balance,
      threshold,
      ddBuffer: balance - threshold,
      locked,
      breached,
      breachedAt,
    },
    consistency,
    eval: evalResult,
    funded,
  }
}
