import { describe, it, expect } from "vitest"
import { computeBankrollCurve } from "./compute-bankroll-curve"
import type { BacktestEvent } from "../types"

const BASE = { bankroll_initial: 1000, eval_cost: 100 }

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
  return types.map((t) => (Array.isArray(t) ? makeEvent(t[0], t[1]) : makeEvent(t)))
}

describe("computeBankrollCurve", () => {
  it("empty log → single point with initial bankroll", () => {
    const pts = computeBankrollCurve([], BASE)
    expect(pts).toEqual([{ step: 0, bankroll: 1000, event: null }])
  })

  it("[E] → step 0 = 1000, step 1 = 900 (E costs 100)", () => {
    const pts = computeBankrollCurve(events("E"), BASE)
    expect(pts).toHaveLength(2)
    expect(pts[1]).toMatchObject({ step: 1, bankroll: 900, event: "E" })
  })

  it("F does not change bankroll", () => {
    const pts = computeBankrollCurve(events("E", "F"), BASE)
    expect(pts[1].bankroll).toBe(900)
    expect(pts[2].bankroll).toBe(900) // F unchanged
    expect(pts[2].event).toBe("F")
  })

  it("P adds the payout amount to bankroll", () => {
    const pts = computeBankrollCurve(events("E", "F", ["P", 500]), BASE)
    expect(pts[3]).toMatchObject({ step: 3, bankroll: 1400, event: "P" })
  })

  it("full sequence preserves running total", () => {
    const pts = computeBankrollCurve(
      events("E", "F", ["P", 500], "E", ["P", 200], "E"),
      BASE,
    )
    // 1000, 900, 900, 1400, 1300, 1500, 1400
    expect(pts.map((p) => p.bankroll)).toEqual([1000, 900, 900, 1400, 1300, 1500, 1400])
  })
})
