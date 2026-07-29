import { describe, expect, it } from "vitest"
import { computeAccountState } from "./compute-account-state"
import type { AccountRules, TradingDay } from "@/features/backtest/types"

/**
 * Regression: a withdrawal is applied AFTER the per-trade loop, so a payout that
 * drops the balance to/below the (locked) threshold was never breach-checked —
 * the account sat at the floor showing "active" and never offered a New eval.
 * Breach must be re-evaluated after applying a withdrawal.
 */
const RULES: AccountRules = {
  startingBalance: 50000,
  ddAmount: 2000,
  ddType: "EOD",
  evalProfitTarget: 3000,
  evalConsistencyPct: null,
  evalMinProfitDays: null,
  evalMinProfitAmount: null,
  fundedConsistencyPct: null,
  fundedMinProfitDays: null,
  fundedMinProfitAmount: null,
}

describe("computeAccountState — funded withdrawal breach", () => {
  it("breaches when a withdrawal drops balance to the locked threshold", () => {
    // d1: +2100 → 52,100 → locks (threshold 50,100); withdraw 2000 → 50,100 == floor
    const days: TradingDay[] = [
      { id: "d1", trades: [{ id: "t1", pnl: 2100 }], withdrawal: 2000 },
    ]
    const state = computeAccountState(RULES, "funded", days)

    expect(state.final.threshold).toBe(50100) // locked at start+100
    expect(state.final.balance).toBe(50100) // withdrawal landed on the floor
    expect(state.final.breached).toBe(true) // balance <= threshold → breached
  })
})
