import { describe, it, expect } from "vitest"
import { computeAccountState } from "./compute-account-state"
import type { AccountRules, TradingDay } from "../types"


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _dayId = 0
let _tradeId = 0

function reset() {
  _dayId = 0
  _tradeId = 0
}

function day(...pnls: number[]): TradingDay {
  _dayId++
  return {
    id: `day-${_dayId}`,
    trades: pnls.map((pnl) => ({ id: `t-${++_tradeId}`, pnl })),
  }
}

const EOD_RULES: AccountRules = {
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

const ITD_RULES: AccountRules = { ...EOD_RULES, ddType: "Intraday" }

// ---------------------------------------------------------------------------
// B-1: EOD scenarios
// ---------------------------------------------------------------------------

describe("computeAccountState — EOD — initial state", () => {
  it("REQ-ENG-01: initial state before any day", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [])
    expect(state.final.balance).toBe(50000)
    expect(state.final.threshold).toBe(48000) // 50000 - 2000
    expect(state.final.locked).toBe(false)
    expect(state.final.breached).toBe(false)
    expect(state.final.ddBuffer).toBe(2000)
    expect(state.days).toHaveLength(0)
  })
})

describe("computeAccountState — EOD — SCENARIO EOD-1: normal trail-up", () => {
  it("trails HWM at end-of-day when balance rises", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [day(500, 300)])
    const d = state.days[0]
    expect(d.endBalance).toBe(50800)
    expect(d.endThreshold).toBe(48800) // hwm=50800, threshold=hwm-2000
    expect(d.locked).toBe(false)
    expect(d.breached).toBe(false)
    expect(d.endBuffer).toBe(2000)
  })
})

describe("computeAccountState — EOD — SCENARIO EOD-2: no trail-down", () => {
  it("losing day does NOT lower HWM or threshold", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [day(500, 300), day(-300)])
    const d1 = state.days[0]
    const d2 = state.days[1]
    expect(d1.endBalance).toBe(50800)
    expect(d1.endThreshold).toBe(48800)
    // day 2: -300 → balance=50500, hwm stays 50800, threshold stays 48800
    expect(d2.endBalance).toBe(50500)
    expect(d2.endThreshold).toBe(48800) // unchanged
    expect(d2.endBuffer).toBe(1700)
    expect(d2.breached).toBe(false)
  })
})

describe("computeAccountState — EOD — SCENARIO EOD-3: intraday peak does NOT trail HWM", () => {
  it("HWM updates on close only, not on intraday peak", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [day(2000, -1500)])
    const d = state.days[0]
    // intraday peak = 52000 but end balance = 50500
    // Mid-trade threshold was FROZEN at 48000 (not updated by +2000 intraday)
    const tradeAfterFirst = d.trades[0]
    expect(tradeAfterFirst.hwm).toBe(50000) // no mid-day update in EOD mode
    expect(tradeAfterFirst.threshold).toBe(48000)
    // end of day: hwm=50500, threshold=48500
    expect(d.endBalance).toBe(50500)
    expect(d.endThreshold).toBe(48500)
  })
})

describe("computeAccountState — EOD — SCENARIO EOD-4: intraday dip breaches frozen threshold", () => {
  it("dip below frozen threshold breaches immediately at that trade", () => {
    reset()
    // state entering: balance=50000, hwm=50000, threshold=48000
    const state = computeAccountState(EOD_RULES, "eval", [day(-2100)])
    const d = state.days[0]
    expect(d.endBalance).toBe(47900)
    expect(d.breached).toBe(true)
    expect(d.endBuffer).toBe(-100) // 47900 - 48000
    // Breach captured: trade level
    const t = d.trades[0]
    expect(t.breached).toBe(true)
    expect(t.balance).toBe(47900)
  })
})

describe("computeAccountState — EOD — SCENARIO EOD-5: no breach when above threshold", () => {
  it("dip that stays above threshold does not breach", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [day(-1900)])
    const d = state.days[0]
    expect(d.endBalance).toBe(48100)
    expect(d.breached).toBe(false)
    expect(d.endBuffer).toBe(100)
  })
})

describe("computeAccountState — EOD — SCENARIO EOD-6: lock trigger fires at end-of-day", () => {
  it("lock fires at EOD when balance >= start+dd+100", () => {
    reset()
    // 50000 + 2000 + 100 = 52100 — trade brings balance exactly there
    const state = computeAccountState(EOD_RULES, "eval", [day(2100)])
    const d = state.days[0]
    expect(d.endBalance).toBe(52100)
    expect(d.locked).toBe(true)
    expect(d.endThreshold).toBe(50100) // start+100 = 50000+100
    // Trade-level state: lock NOT yet fired mid-trade in EOD mode
    expect(d.trades[0].locked).toBe(false)
  })
})

describe("computeAccountState — EOD — SCENARIO EOD-7: post-lock threshold frozen", () => {
  it("threshold does not trail after lock", () => {
    reset()
    // Day 1 triggers lock; Day 2 has another winning trade
    const state = computeAccountState(EOD_RULES, "eval", [day(2100), day(500)])
    const d2 = state.days[1]
    expect(d2.locked).toBe(true)
    expect(d2.endThreshold).toBe(50100) // frozen at start+100
    expect(d2.endBalance).toBe(52600)
  })
})

describe("computeAccountState — EOD — SCENARIO EOD-8: breach against locked threshold", () => {
  it("balance below locked threshold breaches", () => {
    reset()
    // Day 1: lock fires. Day 2: -2001 → 52100-2001=50099 <= 50100 → breached
    const state = computeAccountState(EOD_RULES, "eval", [day(2100), day(-2001)])
    const d2 = state.days[1]
    expect(d2.locked).toBe(true)
    expect(d2.endBalance).toBe(50099)
    expect(d2.breached).toBe(true)
  })
})

describe("computeAccountState — EOD — SCENARIO EOD-9: 5-day worked example with lock", () => {
  it("matches the corrected worked example with lock on day 4", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [
      day(500),   // D1: close=50500, hwm=50500, threshold=48500
      day(800),   // D2: close=51300, hwm=51300, threshold=49300
      day(700),   // D3: close=52000, hwm=52000, threshold=50000
      day(100),   // D4: close=52100 → LOCK fires, threshold=50100
      day(-200),  // D5: close=51900, threshold=50100 (frozen), buffer=1800
    ])

    const [d1, d2, d3, d4, d5] = state.days

    expect(d1.endBalance).toBe(50500)
    expect(d1.endThreshold).toBe(48500)
    expect(d1.locked).toBe(false)

    expect(d2.endBalance).toBe(51300)
    expect(d2.endThreshold).toBe(49300)
    expect(d2.locked).toBe(false)

    expect(d3.endBalance).toBe(52000)
    expect(d3.endThreshold).toBe(50000)
    expect(d3.locked).toBe(false)

    // Day 4: lock fires
    expect(d4.endBalance).toBe(52100)
    expect(d4.locked).toBe(true)
    expect(d4.endThreshold).toBe(50100)
    expect(d4.endBuffer).toBe(2000) // 52100 - 50100

    // Day 5: locked, threshold FROZEN → buffer 1800 (not 2000)
    expect(d5.endBalance).toBe(51900)
    expect(d5.locked).toBe(true)
    expect(d5.endThreshold).toBe(50100) // unchanged
    expect(d5.endBuffer).toBe(1800) // 51900 - 50100
    expect(d5.breached).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// B-2: Intraday scenarios
// ---------------------------------------------------------------------------

describe("computeAccountState — Intraday — SCENARIO ITD-1: per-trade HWM trail", () => {
  it("trails HWM after each winning trade", () => {
    reset()
    const state = computeAccountState(ITD_RULES, "eval", [day(500, 300)])
    const d = state.days[0]
    // After trade 1: balance=50500, hwm=50500, threshold=48500
    expect(d.trades[0].balance).toBe(50500)
    expect(d.trades[0].hwm).toBe(50500)
    expect(d.trades[0].threshold).toBe(48500)
    // After trade 2: balance=50800, hwm=50800, threshold=48800
    expect(d.trades[1].balance).toBe(50800)
    expect(d.trades[1].hwm).toBe(50800)
    expect(d.trades[1].threshold).toBe(48800)
  })
})

describe("computeAccountState — Intraday — SCENARIO ITD-2: no trail-down on losing trade", () => {
  it("HWM stays when trade is losing", () => {
    reset()
    // +500 sets hwm=50500; then -200 → balance=50300, hwm stays
    const state = computeAccountState(ITD_RULES, "eval", [day(500, -200)])
    const t2 = state.days[0].trades[1]
    expect(t2.balance).toBe(50300)
    expect(t2.hwm).toBe(50500) // unchanged
    expect(t2.threshold).toBe(48500)
    expect(t2.ddBuffer).toBe(1800)
    expect(t2.breached).toBe(false)
  })
})

describe("computeAccountState — Intraday — SCENARIO ITD-3: intraday breach mid-day", () => {
  it("losing trade hits updated threshold → breached mid-day", () => {
    reset()
    // +1000 → hwm=51000, threshold=49000; then -3100 → balance=47900 <= 49000 → breach
    const state = computeAccountState(ITD_RULES, "eval", [day(1000, -3100)])
    const d = state.days[0]
    const t1 = d.trades[0]
    const t2 = d.trades[1]
    expect(t1.hwm).toBe(51000)
    expect(t1.threshold).toBe(49000)
    expect(t2.balance).toBe(47900)
    expect(t2.breached).toBe(true)
    expect(d.breached).toBe(true)
  })
})

describe("computeAccountState — Intraday — SCENARIO ITD-4: order dependence", () => {
  it("Order A: +1000 then -2100 → breach (threshold raised to 49000)", () => {
    reset()
    const state = computeAccountState(ITD_RULES, "eval", [day(1000, -2100)])
    const t2 = state.days[0].trades[1]
    // balance=48900 <= threshold=49000 → breach
    expect(t2.balance).toBe(48900)
    expect(t2.threshold).toBe(49000)
    expect(t2.breached).toBe(true)
  })

  it("Order B: -2100 then +1000 → breach on first trade", () => {
    reset()
    const state = computeAccountState(ITD_RULES, "eval", [day(-2100, 1000)])
    const t1 = state.days[0].trades[0]
    // balance=47900 <= threshold=48000 → immediate breach
    expect(t1.balance).toBe(47900)
    expect(t1.threshold).toBe(48000)
    expect(t1.breached).toBe(true)
  })

  it("Order C: -1900 then +500 → no breach", () => {
    reset()
    const state = computeAccountState(ITD_RULES, "eval", [day(-1900, 500)])
    const d = state.days[0]
    const t1 = d.trades[0]
    const t2 = d.trades[1]
    // After -1900: balance=48100 > 48000, no breach, no new HWM
    expect(t1.balance).toBe(48100)
    expect(t1.breached).toBe(false)
    expect(t1.hwm).toBe(50000) // no new high
    // After +500: balance=48600, hwm still 50000
    expect(t2.balance).toBe(48600)
    expect(t2.hwm).toBe(50000)
    expect(t2.breached).toBe(false)
    expect(d.breached).toBe(false)
  })
})

describe("computeAccountState — Intraday — SCENARIO ITD-5: lock fires mid-day on winning trade", () => {
  it("lock triggers between trades when balance hits start+dd+100", () => {
    reset()
    // +1000 → 51000 (no lock); +1100 → 52100 >= 52100 → LOCK
    const state = computeAccountState(ITD_RULES, "eval", [day(1000, 1100)])
    const d = state.days[0]
    const t1 = d.trades[0]
    const t2 = d.trades[1]
    expect(t1.locked).toBe(false)
    expect(t2.locked).toBe(true)
    expect(t2.threshold).toBe(50100) // start+100
    expect(t2.balance).toBe(52100)
  })
})

describe("computeAccountState — Intraday — SCENARIO ITD-6: post-lock no further trailing", () => {
  it("after lock fires, additional winning trades do not move threshold", () => {
    reset()
    // Day 1: +1000, +1100 (lock fires on t2); Day 2: +500 (should not move threshold)
    const state = computeAccountState(ITD_RULES, "eval", [day(1000, 1100), day(500)])
    const d2 = state.days[1]
    expect(d2.locked).toBe(true)
    expect(d2.endThreshold).toBe(50100) // unchanged
    expect(d2.endBalance).toBe(52600)
  })
})

// ---------------------------------------------------------------------------
// B-3: Eval consistency scenarios
// ---------------------------------------------------------------------------

describe("computeAccountState — Eval consistency — SCENARIO CON-1: below base target", () => {
  it("pass_blocked when below profit target despite no consistency raise", () => {
    reset()
    const rules: AccountRules = { ...EOD_RULES, evalConsistencyPct: 0.5 }
    // net=1500, best_winning_day=1000 → effective=max(3000, 1000/0.5=2000)=3000
    const state = computeAccountState(rules, "eval", [day(1000), day(500)])
    expect(state.consistency).not.toBeNull()
    if (state.consistency) {
      expect(state.consistency.effectiveTarget).toBe(3000)
      expect(state.consistency.bestWinningDay).toBe(1000)
      expect(state.consistency.satisfied).toBe(false) // net=1500 < 3000
      expect(state.consistency.raisedByConsistency).toBe(false)
    }
    expect(state.eval?.passEligible).toBe(false)
  })
})

describe("computeAccountState — Eval consistency — SCENARIO CON-2: boundary inclusive (3200 >= 3200)", () => {
  it("passes exactly at effective target boundary", () => {
    reset()
    const rules: AccountRules = { ...EOD_RULES, evalConsistencyPct: 0.5 }
    // net=3200, best_winning_day=1600 → effective=max(3000, 1600/0.5=3200)=3200 → passes
    const state = computeAccountState(rules, "eval", [day(1600), day(800), day(800)])
    expect(state.consistency).not.toBeNull()
    if (state.consistency) {
      expect(state.consistency.effectiveTarget).toBe(3200)
      expect(state.consistency.bestWinningDay).toBe(1600)
      expect(state.consistency.raisedByConsistency).toBe(true)
      expect(state.consistency.satisfied).toBe(true) // 3200 >= 3200
    }
    expect(state.eval?.passEligible).toBe(true)
    expect(state.eval?.effectiveTarget).toBe(3200)
  })
})

describe("computeAccountState — Eval consistency — SCENARIO CON-3: new bigger winning day re-raises target", () => {
  it("larger day re-raises effective_target", () => {
    reset()
    const rules: AccountRules = { ...EOD_RULES, evalConsistencyPct: 0.5 }
    // Start: net=3200, best=1600 → et=3200 passes; add day +2000 → net=5200, best=2000 → et=4000
    const state = computeAccountState(rules, "eval", [day(1600), day(800), day(800), day(2000)])
    if (state.consistency) {
      expect(state.consistency.bestWinningDay).toBe(2000)
      expect(state.consistency.effectiveTarget).toBe(4000) // max(3000, 2000/0.5)
      expect(state.consistency.raisedByConsistency).toBe(true)
      expect(state.consistency.satisfied).toBe(true) // 5200 >= 4000
    }
  })
})

describe("computeAccountState — Eval consistency — SCENARIO CON-4: no eval_consistency_pct", () => {
  it("consistency is null when eval_consistency_pct not set", () => {
    reset()
    const rules: AccountRules = { ...EOD_RULES, evalConsistencyPct: null }
    const state = computeAccountState(rules, "eval", [day(1600)])
    expect(state.consistency).toBeNull()
    // Pass determined by profit target only: net=1600 < 3000 → not eligible
    expect(state.eval?.passEligible).toBe(false)
    expect(state.eval?.effectiveTarget).toBe(3000)
  })
})

describe("computeAccountState — Eval consistency — SCENARIO CON-5: losing days excluded from best_winning_day", () => {
  it("only positive-pnl days count toward best_winning_day", () => {
    reset()
    const rules: AccountRules = { ...EOD_RULES, evalConsistencyPct: 0.5 }
    // days: -500, +800, 0 → best_winning_day=800 (only positive days)
    const state = computeAccountState(rules, "eval", [day(-500), day(800), day(0)])
    if (state.consistency) {
      expect(state.consistency.bestWinningDay).toBe(800)
      expect(state.consistency.effectiveTarget).toBe(3000) // max(3000, 800/0.5=1600)=3000
    }
  })
})

describe("computeAccountState — Eval consistency — SCENARIO CON-6: funded_consistency_pct in eval phase → ignored", () => {
  it("funded_consistency_pct has no effect on eval pass", () => {
    reset()
    const rules: AccountRules = {
      ...EOD_RULES,
      evalConsistencyPct: null,
      fundedConsistencyPct: 0.4,
    }
    const state = computeAccountState(rules, "eval", [day(1600)])
    // eval pct is null → consistency result is null
    expect(state.consistency).toBeNull()
    expect(state.eval?.passEligible).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// B-4: Funded withdrawal gating scenarios
// ---------------------------------------------------------------------------

const FUNDED_RULES: AccountRules = {
  startingBalance: 50000,
  ddAmount: 2000,
  ddType: "EOD",
  evalProfitTarget: 3000, // not used in funded phase
  evalConsistencyPct: null,
  evalMinProfitDays: null,
  evalMinProfitAmount: null,
  fundedConsistencyPct: null,
  fundedMinProfitDays: null,
  fundedMinProfitAmount: null,
}

describe("computeAccountState — Funded — SCENARIO FWG-1: eligible when no add-on gates", () => {
  it("eligible=true when only requirement is not_breached and it holds", () => {
    reset()
    const state = computeAccountState(FUNDED_RULES, "funded", [day(1000)])
    expect(state.funded).not.toBeNull()
    expect(state.final.breached).toBe(false)
    expect(state.funded?.withdrawalEligible).toBe(true)
  })
})

describe("computeAccountState — Funded — SCENARIO FWG-2: blocked by breach", () => {
  it("eligible=false when breached", () => {
    reset()
    const state = computeAccountState(FUNDED_RULES, "funded", [day(-2100)])
    expect(state.final.breached).toBe(true)
    expect(state.funded?.withdrawalEligible).toBe(false)
  })
})

describe("computeAccountState — Funded — SCENARIO FWG-3: blocked by funded_consistency_pct", () => {
  it("eligible=false when best/total > max pct", () => {
    reset()
    const rules: AccountRules = { ...FUNDED_RULES, fundedConsistencyPct: 0.4 }
    // total=3500, best=2000 → ratio=0.571 > 0.40 → blocked
    const state = computeAccountState(rules, "funded", [day(2000), day(1000), day(500)])
    expect(state.consistency).not.toBeNull()
    if (state.consistency) {
      expect(state.consistency.satisfied).toBe(false) // ratio > max
    }
    expect(state.funded?.withdrawalEligible).toBe(false)
  })
})

describe("computeAccountState — Funded — SCENARIO FWG-4: consistency blocked when ratio > limit", () => {
  it("0.429 > 0.40 → blocked", () => {
    reset()
    const rules: AccountRules = { ...FUNDED_RULES, fundedConsistencyPct: 0.4 }
    // total=3500, best=1500 → ratio=0.4286 > 0.40 → blocked
    const state = computeAccountState(rules, "funded", [day(1000), day(1500), day(1000)])
    if (state.consistency) {
      expect(state.consistency.satisfied).toBe(false)
    }
    expect(state.funded?.withdrawalEligible).toBe(false)
  })
})

describe("computeAccountState — Funded — SCENARIO FWG-5: boundary inclusive (0.40 <= 0.40 → passes)", () => {
  it("eligible=true when ratio exactly equals funded_consistency_pct", () => {
    reset()
    const rules: AccountRules = { ...FUNDED_RULES, fundedConsistencyPct: 0.4 }
    // total=2500, best=1000 → ratio=0.40 <= 0.40 → passes
    const state = computeAccountState(rules, "funded", [day(1000), day(1000), day(500)])
    if (state.consistency) {
      expect(state.consistency.satisfied).toBe(true) // 0.40 <= 0.40
    }
    expect(state.funded?.withdrawalEligible).toBe(true)
  })
})

describe("computeAccountState — Funded — SCENARIO FWG-6: blocked by funded_min_profit_days", () => {
  it("eligible=false when qualifying_days < required_days", () => {
    reset()
    const rules: AccountRules = {
      ...FUNDED_RULES,
      fundedMinProfitDays: 5,
      fundedMinProfitAmount: 150,
    }
    // days: +200✓, +180✓, -50✗, +100✗ (< 150), +160✓ → qualifying=3, needed=5
    const state = computeAccountState(rules, "funded", [day(200), day(180), day(-50), day(100), day(160)])
    expect(state.funded?.profitDaysCount).toBe(3)
    expect(state.funded?.minRequired).toBe(5)
    expect(state.funded?.profitDaysMet).toBe(false)
    expect(state.funded?.withdrawalEligible).toBe(false)
  })
})

describe("computeAccountState — Funded — SCENARIO FWG-7: boundary inclusive (5/5 → passes)", () => {
  it("eligible=true when qualifying_days exactly meets required_days", () => {
    reset()
    const rules: AccountRules = {
      ...FUNDED_RULES,
      fundedMinProfitDays: 5,
      fundedMinProfitAmount: 150,
    }
    // days: +200✓, -500✗, +160✓, 0✗, +155✓, +200✓, -300✗, +150✓ = 5 qualifying
    const state = computeAccountState(rules, "funded", [
      day(200), day(-500), day(160), day(0), day(155), day(200), day(-300), day(150),
    ])
    expect(state.funded?.profitDaysCount).toBe(5)
    expect(state.funded?.profitDaysMet).toBe(true)
    expect(state.funded?.withdrawalEligible).toBe(true)
  })
})

describe("computeAccountState — Funded — SCENARIO FWG-8: both gates must pass", () => {
  it("eligible=false when min_profit_days blocked even if consistency passes", () => {
    reset()
    const rules: AccountRules = {
      ...FUNDED_RULES,
      fundedConsistencyPct: 0.4,
      fundedMinProfitDays: 5,
      fundedMinProfitAmount: 150,
    }
    // Use enough days that total is large so consistency ratio is below 0.4
    // but min_profit_days not met
    const state = computeAccountState(rules, "funded", [
      day(300), day(300), day(300), day(300), // net=1200 if 4 days
    ])
    // ratio = 300/1200 = 0.25 <= 0.40 → consistency passes
    // but qualifying_days (all >= 150) = 4 < 5 → blocked
    expect(state.funded?.profitDaysMet).toBe(false)
    expect(state.funded?.withdrawalEligible).toBe(false)
  })
})

describe("computeAccountState — Funded — SCENARIO FWG-9: both gates pass", () => {
  it("eligible=true when both consistency and min_profit_days pass", () => {
    reset()
    const rules: AccountRules = {
      ...FUNDED_RULES,
      fundedConsistencyPct: 0.4,
      fundedMinProfitDays: 5,
      fundedMinProfitAmount: 150,
    }
    // 5 qualifying days of 200, total=1000 → ratio=200/1000=0.20 <= 0.40
    const state = computeAccountState(rules, "funded", [
      day(200), day(200), day(200), day(200), day(200),
    ])
    expect(state.funded?.profitDaysCount).toBe(5)
    expect(state.funded?.profitDaysMet).toBe(true)
    if (state.consistency) {
      expect(state.consistency.satisfied).toBe(true)
    }
    expect(state.funded?.withdrawalEligible).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Phase reset verification (SCENARIO TRANS-1, TRANS-3)
// ---------------------------------------------------------------------------

describe("computeAccountState — Funded phase RESET", () => {
  it("TRANS-1: funded phase starts at startingBalance regardless of eval end balance", () => {
    reset()
    // Funded phase always starts fresh at startingBalance
    const state = computeAccountState(FUNDED_RULES, "funded", [])
    expect(state.final.balance).toBe(50000)
    expect(state.final.threshold).toBe(48000)
    expect(state.final.locked).toBe(false)
    expect(state.final.breached).toBe(false)
  })

  it("TRANS-3: lock re-trails from startingBalance in funded phase", () => {
    reset()
    // balance reaches 52100 (50000+2000+100) → lock
    const state = computeAccountState(FUNDED_RULES, "funded", [day(2100)])
    const d = state.days[0]
    expect(d.locked).toBe(true)
    expect(d.endThreshold).toBe(50100) // start+100 = 50000+100
  })

  it("TRANS-4: eval_profit_target has NO effect in funded phase", () => {
    reset()
    const rules: AccountRules = { ...FUNDED_RULES }
    // Net profit way above eval_profit_target=3000 but funded phase ignores it
    const state = computeAccountState(rules, "funded", [day(5000)])
    expect(state.eval).toBeNull() // no eval result in funded phase
    expect(state.funded).not.toBeNull()
    // No "pass" concept in funded — only withdrawalEligible
  })
})

// ---------------------------------------------------------------------------
// Additional edge cases
// ---------------------------------------------------------------------------

describe("computeAccountState — Edge cases", () => {
  it("breachedAt captures correct dayId and tradeId", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [day(-2100)])
    expect(state.final.breachedAt).not.toBeNull()
    expect(state.final.breachedAt?.dayId).toBe("day-1")
  })

  it("breach is permanent — subsequent winning trades do not clear it", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [day(-2100), day(5000)])
    expect(state.final.breached).toBe(true)
    expect(state.final.breachedAt?.dayId).toBe("day-1")
  })

  it("eval.passEligible is false when breached even if profit target met", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [day(-2100), day(10000)])
    // net profit > 3000 but breached
    expect(state.eval?.passEligible).toBe(false)
  })

  it("ddBuffer is correctly computed as balance - threshold", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [day(500)])
    expect(state.final.ddBuffer).toBe(state.final.balance - state.final.threshold)
  })

  it("EOD mode: no-trade day produces correct DayState", () => {
    reset()
    const state = computeAccountState(EOD_RULES, "eval", [
      { id: "day-1", trades: [] },
    ])
    const d = state.days[0]
    expect(d.endBalance).toBe(50000)
    expect(d.dayNet).toBe(0)
    expect(d.trades).toHaveLength(0)
  })

  it("funded consistency: no positive-net days → bestWinningDay stays at 0 → consistency null-guarded", () => {
    reset()
    const rules: AccountRules = { ...FUNDED_RULES, fundedConsistencyPct: 0.4 }
    // All days losing → net < 0 → consistency calculation guarded (total_net_profit <= 0)
    const state = computeAccountState(rules, "funded", [day(-100), day(-200)])
    // period_profit <= 0 → withdrawalEligible must be false (BUGFIX: old code allowed this)
    expect(state.funded?.withdrawalEligible).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// B-5: Eval min-days gating
// ---------------------------------------------------------------------------

const EVAL_MINDAYS_RULES: AccountRules = {
  ...EOD_RULES,  // already has evalMinProfitDays: null, evalMinProfitAmount: null
  evalMinProfitDays: 3,
  evalMinProfitAmount: 200,
}

describe("computeAccountState — Eval min-days — MINDAYS-1: gate blocks when count < required", () => {
  it("passEligible=false when qualifying days < required even if profit target met", () => {
    reset()
    // net=1200+(-50)+1200+50=2400+50=2400 — wait: let's pick values that exceed 3000 AND have only 2 profit days
    // net=2000+(-50)+2000+50=4000 > 3000; profit days(>=200): day1✓(2000), day2✗(-50), day3✓(2000), day4✗(50) = 2
    const state = computeAccountState(EVAL_MINDAYS_RULES, "eval", [
      day(2000), day(-50), day(2000), day(50),
    ])
    // qualifying days: day 1 (2000 >= 200 ✓), day 2 (-50 ✗), day 3 (2000 ✓), day 4 (50 ✗) = 2
    expect(state.eval?.passEligible).toBe(false)
    expect(state.eval?.profitDaysCount).toBe(2)
    expect(state.eval?.minProfitDaysRequired).toBe(3)
    expect(state.eval?.profitDaysMet).toBe(false)
  })
})

describe("computeAccountState — Eval min-days — MINDAYS-2: gate passes at boundary (3/3)", () => {
  it("passEligible=true when qualifying days exactly equals required and profit target met", () => {
    reset()
    // net=1200+(-50)+1200+1000=3350 > 3000; profit days (>=200): day1✓, day2✗, day3✓, day4✓ = 3
    const state = computeAccountState(EVAL_MINDAYS_RULES, "eval", [
      day(1200), day(-50), day(1200), day(1000),
    ])
    expect(state.eval?.profitDaysCount).toBe(3)
    expect(state.eval?.profitDaysMet).toBe(true)
    expect(state.eval?.passEligible).toBe(true)
  })
})

describe("computeAccountState — Eval min-days — MINDAYS-3: null pair → gate skipped", () => {
  it("passEligible true when eval_min_profit_days is null (gate not configured)", () => {
    reset()
    // net=1200+(-50)+1200+1000=3350 > 3000; no min-days gate → passEligible=true
    const state = computeAccountState(EOD_RULES, "eval", [
      day(1200), day(-50), day(1200), day(1000),
    ])
    expect(state.eval?.profitDaysMet).toBe(true) // gate not set → always met
    expect(state.eval?.passEligible).toBe(true)
    expect(state.eval?.profitDaysCount).toBeUndefined() // not tracked when gate absent
  })
})

describe("computeAccountState — Eval min-days — MINDAYS-4: symmetric with funded min-days", () => {
  it("eval profit day uses eval_min_profit_amount, not funded_min_profit_amount", () => {
    reset()
    const rules: AccountRules = {
      ...EOD_RULES,
      evalMinProfitDays: 2,
      evalMinProfitAmount: 300,      // higher threshold than funded
      fundedMinProfitDays: 2,
      fundedMinProfitAmount: 100,    // lower threshold
    }
    // days: +200, +200 → net=400; each day is >= 100 but NOT >= 300
    // eval gate: 0 days qualify at 300 → blocked
    const state = computeAccountState(rules, "eval", [day(200), day(200)])
    expect(state.eval?.profitDaysCount).toBe(0)
    expect(state.eval?.profitDaysMet).toBe(false)
    expect(state.eval?.passEligible).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// B-6: Funded per-period withdrawal gating
// ---------------------------------------------------------------------------

describe("computeAccountState — Funded per-period — PERIOD-1: worked example", () => {
  it("user's worked example: period 2 blocked when balance < anchor", () => {
    // funded starts 50k
    // Period 1: 5 days +1000 each = +5000 → balance 55k; last day (d5) carries withdrawal 2000
    //   d5 net=1000 (profit day ✓), balance 55k, withdraw 2k → 53k; anchor P2=53k
    //   P1 profit days: 5 (d1-d5 all +1000 >= 200) ✓ — but withdrawal happens regardless (engine trusts input)
    // Period 2: d6-d9: +1000 each → 57k; d10: -4500 → 52.5k
    //   periodProfit = 52.5k - 53k = -500 < 0 → BLOCKED
    reset()
    const rules: AccountRules = {
      startingBalance: 50000,
      ddAmount: 2000,
      ddType: "EOD",
      evalProfitTarget: 3000,
      evalConsistencyPct: null,
      evalMinProfitDays: null,
      evalMinProfitAmount: null,
      fundedConsistencyPct: null,
      fundedMinProfitDays: null,  // no min-days gate so withdrawal in P1 is eligible
      fundedMinProfitAmount: null,
    }
    const tradingDays: TradingDay[] = [
      { id: "d1", trades: [{ id: "t1", pnl: 1000 }] },                  // P1 day1: balance=51k
      { id: "d2", trades: [{ id: "t2", pnl: 1000 }] },                  // P1 day2: balance=52k
      { id: "d3", trades: [{ id: "t3", pnl: 1000 }] },                  // P1 day3: balance=53k
      { id: "d4", trades: [{ id: "t4", pnl: 1000 }] },                  // P1 day4: balance=54k
      { id: "d5", trades: [{ id: "t5", pnl: 1000 }], withdrawal: 2000 }, // P1 day5: balance=55k, withdraw 2k → 53k; anchor P2=53k
      { id: "d6", trades: [{ id: "t6", pnl: 1000 }] },                  // P2 day1: balance=54k
      { id: "d7", trades: [{ id: "t7", pnl: 1000 }] },                  // P2 day2: balance=55k
      { id: "d8", trades: [{ id: "t8", pnl: 1000 }] },                  // P2 day3: balance=56k
      { id: "d9", trades: [{ id: "t9", pnl: 1000 }] },                  // P2 day4: balance=57k
      { id: "d10", trades: [{ id: "t10", pnl: -4500 }] },               // P2 day5: -4500 → balance=52.5k
    ]
    // P2: periodProfit = 52500 - 53000 = -500 → BLOCKED
    const state = computeAccountState(rules, "funded", tradingDays)

    // Period 2 check: periodProfit < 0 → withdrawalEligible=false
    expect(state.funded?.withdrawalEligible).toBe(false)
    expect(state.funded?.periodProfit).toBe(-500)
  })
})

describe("computeAccountState — Funded per-period — PERIOD-2: period_profit > 0 required", () => {
  it("withdrawalEligible=false when period_profit <= 0 even if min-days and consistency pass", () => {
    reset()
    const rules: AccountRules = {
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
    // No withdrawal yet, balance just dropped below starting_balance (period_profit < 0)
    const state = computeAccountState(rules, "funded", [
      day(500), day(-600),
    ])
    // balance=49900, period_profit = 49900-50000 = -100 → blocked
    expect(state.funded?.withdrawalEligible).toBe(false)
    expect(state.funded?.periodProfit).toBe(-100)
  })
})

describe("computeAccountState — Funded per-period — PERIOD-3: first period eligible", () => {
  it("withdrawalEligible=true when first period has positive profit and no gates", () => {
    reset()
    const rules: AccountRules = {
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
    const state = computeAccountState(rules, "funded", [day(1000), day(500)])
    // period_profit = 51500 - 50000 = 1500 > 0 → eligible
    expect(state.funded?.withdrawalEligible).toBe(true)
    expect(state.funded?.periodProfit).toBe(1500)
  })
})

describe("computeAccountState — Funded per-period — PERIOD-4: profit-days RESET per period", () => {
  it("profit-day counter resets at each withdrawal; period 2 counted independently", () => {
    reset()
    const rules: AccountRules = {
      startingBalance: 50000,
      ddAmount: 2000,
      ddType: "EOD",
      evalProfitTarget: 3000,
      evalConsistencyPct: null,
      evalMinProfitDays: null,
      evalMinProfitAmount: null,
      fundedConsistencyPct: null,
      fundedMinProfitDays: 3,
      fundedMinProfitAmount: 100,
    }
    // Period 1: 3 profitable days → eligible → withdraw 1000 → anchor P2 = 51500
    // Period 2: only 2 profitable days so far → blocked
    const tradingDays: TradingDay[] = [
      { id: "d1", trades: [{ id: "t1", pnl: 500 }] },             // P1 ✓
      { id: "d2", trades: [{ id: "t2", pnl: 500 }] },             // P1 ✓
      { id: "d3", trades: [{ id: "t3", pnl: 500 }], withdrawal: 1000 }, // P1 ✓ → withdraw → anchor P2=51500
      { id: "d4", trades: [{ id: "t4", pnl: 500 }] },             // P2 ✓
      { id: "d5", trades: [{ id: "t5", pnl: 500 }] },             // P2 ✓
      // No 3rd P2 day → profitDaysCount=2 < 3 → blocked
    ]
    const state = computeAccountState(rules, "funded", tradingDays)
    expect(state.funded?.profitDaysCount).toBe(2)   // only P2 days
    expect(state.funded?.profitDaysMet).toBe(false)
    expect(state.funded?.withdrawalEligible).toBe(false)
  })
})

describe("computeAccountState — Funded per-period — PERIOD-5: per-period consistency", () => {
  it("consistency measured on current period profit and period best day only", () => {
    reset()
    const rules: AccountRules = {
      startingBalance: 50000,
      ddAmount: 2000,
      ddType: "EOD",
      evalProfitTarget: 3000,
      evalConsistencyPct: null,
      evalMinProfitDays: null,
      evalMinProfitAmount: null,
      fundedConsistencyPct: 0.4,
      fundedMinProfitDays: null,
      fundedMinProfitAmount: null,
    }
    // Period 1: +2000, +1000 → period_profit=3000, best=2000 → ratio=0.667 > 0.4 → blocked P1
    // But after withdrawal (if we could), P2 would reset
    // Test: P1 consistency blocks even though period_profit > 0
    const tradingDays: TradingDay[] = [
      { id: "d1", trades: [{ id: "t1", pnl: 2000 }] },
      { id: "d2", trades: [{ id: "t2", pnl: 1000 }] },
    ]
    const state = computeAccountState(rules, "funded", tradingDays)
    // period_profit = 3000 > 0, best = 2000, ratio = 0.667 > 0.4 → blocked
    expect(state.funded?.withdrawalEligible).toBe(false)
    expect(state.consistency?.satisfied).toBe(false)
  })
})

describe("computeAccountState — Funded per-period — PERIOD-6: DD floor static across withdrawals", () => {
  it("withdrawal does not reset DD threshold; floor stays at lock point", () => {
    reset()
    const rules: AccountRules = {
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
    // Day 1: +2100 → balance=52100 → lock fires → threshold=50100
    // Day 2 carries withdrawal: net=0, withdraw 1000 → balance=51100
    // Day 3: -1100 → balance=50000; threshold STILL 50100 (static) → not breached yet (50000 > 50100? NO → breach)
    // Actually 50000 <= 50100 → breached
    const tradingDays: TradingDay[] = [
      { id: "d1", trades: [{ id: "t1", pnl: 2100 }] },                // lock fires
      { id: "d2", trades: [{ id: "t2", pnl: 0 }], withdrawal: 1000 }, // withdraw, balance=51100
      { id: "d3", trades: [{ id: "t3", pnl: -1100 }] },               // 51100-1100=50000 <= 50100 → breached
    ]
    const state = computeAccountState(rules, "funded", tradingDays)
    // threshold should still be 50100 (locked from day 1, never reset by withdrawal)
    expect(state.days[0].locked).toBe(true)
    expect(state.days[0].endThreshold).toBe(50100)
    // After withdrawal day: balance=51100, threshold still 50100
    expect(state.days[1].endBalance).toBe(51100)
    expect(state.days[1].endThreshold).toBe(50100)
    // Day 3: breached
    expect(state.days[2].breached).toBe(true)
    expect(state.days[2].endThreshold).toBe(50100)
  })
})
