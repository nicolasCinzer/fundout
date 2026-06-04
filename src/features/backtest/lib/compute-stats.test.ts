import { describe, it, expect } from "vitest"
import { computeStats } from "./compute-stats"
import type { BacktestEvent } from "../types"

const BASE_BACKTEST = { bankroll_initial: 1000, eval_cost: 100 }

let _pos = 0
function makeEvent(type: "E" | "F" | "P", amount?: number): BacktestEvent {
  _pos++
  return {
    id: `ev-${_pos}`,
    backtest_id: "bt-1",
    user_id: "user-1",
    position: _pos,
    type,
    amount: amount ?? (type === "P" ? 100 : null),
    notes: null,
    created_at: new Date().toISOString(),
  }
}

function events(...types: Array<"E" | "F" | "P" | [type: "P", amount: number]>): BacktestEvent[] {
  _pos = 0
  return types.map((t) => {
    if (Array.isArray(t)) return makeEvent(t[0], t[1])
    return makeEvent(t)
  })
}

describe("computeStats — empty log", () => {
  it("returns all-zeros stats, bankrollCurrent = bankroll_initial, roi = 0, isGameOver = false", () => {
    const stats = computeStats([], BASE_BACKTEST)
    expect(stats.counts).toEqual({ E: 0, F: 0, P: 0 })
    expect(stats.rates).toEqual({ funded: 0, payout: 0, success: 0 })
    expect(stats.worstStreak).toBe(0)
    expect(stats.payoutsTotal).toBe(0)
    expect(stats.payoutsMean).toBe(0)
    expect(stats.evalsSpend).toBe(0)
    expect(stats.netProfit).toBe(0)
    expect(stats.bankrollCurrent).toBe(1000)
    expect(stats.roi).toBe(0)
    expect(stats.isGameOver).toBe(false)
  })
})

describe("computeStats — single E", () => {
  it("counts E=1, evalsSpend=eval_cost, bankrollCurrent = initial - eval_cost", () => {
    const stats = computeStats(events("E"), BASE_BACKTEST)
    expect(stats.counts.E).toBe(1)
    expect(stats.counts.F).toBe(0)
    expect(stats.counts.P).toBe(0)
    expect(stats.evalsSpend).toBe(100)
    expect(stats.bankrollCurrent).toBe(900)
    expect(stats.netProfit).toBe(-100)
    expect(stats.isGameOver).toBe(false)
  })
})

describe("computeStats — E, F, P(500)", () => {
  it("counts correct, rates correct, payoutsTotal=500", () => {
    const stats = computeStats(events("E", "F", ["P", 500]), BASE_BACKTEST)
    expect(stats.counts).toEqual({ E: 1, F: 1, P: 1 })
    expect(stats.payoutsTotal).toBe(500)
    expect(stats.payoutsMean).toBe(500)
    expect(stats.evalsSpend).toBe(100)
    expect(stats.netProfit).toBe(400) // 500 - 100
    expect(stats.bankrollCurrent).toBe(1400)
    expect(stats.rates.funded).toBeCloseTo(1) // 1/1
    expect(stats.rates.payout).toBeCloseTo(1) // 1/1
    expect(stats.rates.success).toBeCloseTo(1) // 1/1
    expect(stats.isGameOver).toBe(false)
  })
})

describe("computeStats — worstStreak (Amendment 1: lifecycle-status based)", () => {
  it("[E, E, E] (no F) → worstStreak=2 under Amendment 1 (LC3 is open, not lost)", () => {
    // Under Amendment 1: LC1=lost, LC2=lost, LC3=open (skipped).
    // worstStreak = 2 (not 3 — the last E is still "open", not resolved).
    const stats = computeStats(events("E", "E", "E"), BASE_BACKTEST)
    expect(stats.worstStreak).toBe(2)
  })

  it("[E, F, E, F, E, F] → worstStreak=2 (LC1=blown_no_payout, LC2=blown_no_payout, LC3=open)", () => {
    // LC1: E1+F, closed by E2 → blown_no_payout (counts toward streak)
    // LC2: E2+F, closed by E3 → blown_no_payout (counts toward streak)
    // LC3: E3+F, end of log → open (skipped)
    // Streak: blown_no_payout(1), blown_no_payout(2), skip open → worstStreak=2
    const stats = computeStats(events("E", "F", "E", "F", "E", "F"), BASE_BACKTEST)
    expect(stats.worstStreak).toBe(2)
  })

  it("[E, F, E, F, E] → worstStreak=2 (2 blown_no_payout before open)", () => {
    // LC1=blown_no_payout, LC2=blown_no_payout, LC3=open (skip)
    const stats = computeStats(events("E", "F", "E", "F", "E"), BASE_BACKTEST)
    expect(stats.worstStreak).toBe(2)
  })

  it("[E, F, P, E, E] → worstStreak=1 (funded_paid breaks, then 1 lost)", () => {
    // LC1: E+F+P → funded_paid (BREAKS streak)
    // LC2: E, closed by E3 → lost (1)
    // LC3: E → open (skip)
    const stats = computeStats(events("E", "F", "P", "E", "E"), BASE_BACKTEST)
    expect(stats.worstStreak).toBe(1)
  })

  it("S-18 under Amendment 1: [E,E,E,F,P,E,E] → worstStreak=2 not 3", () => {
    // LC1: E1 → next E arrives → lost (streak=1)
    // LC2: E2 → next E arrives → lost (streak=2)
    // LC3: E3+F+P → next E arrives → funded_paid (BREAKS streak, reset to 0)
    // LC4: E6 → next E arrives → lost (streak=1)
    // LC5: E7 → end → open (skip)
    // worstStreak = max(2, 1) = 2
    // NOTE: Original S-18 expected 3 under the old consecutive-E algorithm.
    //       Under Amendment 1 (lifecycle-status based), correct answer is 2.
    const stats = computeStats(events("E", "E", "E", "F", "P", "E", "E"), BASE_BACKTEST)
    expect(stats.worstStreak).toBe(2)
  })
})

describe("computeStats — zero-division guards", () => {
  it("no E → all rates = 0", () => {
    const stats = computeStats([], BASE_BACKTEST)
    expect(stats.rates.funded).toBe(0)
    expect(stats.rates.payout).toBe(0)
    expect(stats.rates.success).toBe(0)
  })

  it("E but no F → payout rate = 0", () => {
    const stats = computeStats(events("E"), BASE_BACKTEST)
    expect(stats.rates.funded).toBe(0)
    expect(stats.rates.payout).toBe(0)
    expect(stats.rates.success).toBe(0)
  })
})

describe("computeStats — isGameOver (Amendment 2)", () => {
  it("isGameOver=true when bankrollCurrent <= 0", () => {
    // bankroll_initial=100, eval_cost=200, 1 E → bankrollCurrent = 100-200 = -100
    const stats = computeStats(events("E"), {
      bankroll_initial: 100,
      eval_cost: 200,
    })
    expect(stats.bankrollCurrent).toBe(-100)
    expect(stats.isGameOver).toBe(true)
  })

  it("isGameOver=true when bankrollCurrent is exactly 0", () => {
    // bankroll_initial=100, eval_cost=100, 1 E → bankrollCurrent = 0
    const stats = computeStats(events("E"), {
      bankroll_initial: 100,
      eval_cost: 100,
    })
    expect(stats.bankrollCurrent).toBe(0)
    expect(stats.isGameOver).toBe(true)
  })

  it("isGameOver=false when bankrollCurrent > 0", () => {
    const stats = computeStats(events("E"), BASE_BACKTEST)
    expect(stats.bankrollCurrent).toBe(900)
    expect(stats.isGameOver).toBe(false)
  })
})

describe("computeStats — no NaN or Infinity", () => {
  it("returns finite values for all stats on empty log", () => {
    const stats = computeStats([], BASE_BACKTEST)
    for (const val of Object.values(stats.rates)) {
      expect(Number.isFinite(val)).toBe(true)
    }
    expect(Number.isFinite(stats.roi)).toBe(true)
    expect(Number.isFinite(stats.payoutsMean)).toBe(true)
  })

  it("returns finite values when no F events", () => {
    const stats = computeStats(events("E", "E"), BASE_BACKTEST)
    expect(Number.isFinite(stats.rates.payout)).toBe(true)
    expect(Number.isFinite(stats.rates.success)).toBe(true)
  })
})
