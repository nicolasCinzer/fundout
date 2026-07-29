import { describe, expect, it } from "vitest"
import { toAccountRules } from "@/features/backtest/types"

/**
 * Regression: Supabase returns `numeric` columns as STRINGS at runtime even
 * though the generated types say `number`. toAccountRules must coerce them so
 * the engine never does string arithmetic (which surfaced as $NaN in the UI).
 */
describe("toAccountRules — numeric coercion", () => {
  it("coerces string numerics from the DB into real numbers", () => {
    const row = {
      dd_starting_balance: "50000",
      dd_amount: "2000",
      dd_type: "EOD",
      eval_profit_target: "3000",
      eval_consistency_pct: "50",
      eval_min_profit_days: "5",
      eval_min_profit_amount: "150",
      funded_consistency_pct: null,
      funded_min_profit_days: null,
      funded_min_profit_amount: null,
    } as unknown as Parameters<typeof toAccountRules>[0]

    const rules = toAccountRules(row)

    expect(rules.startingBalance).toBe(50000)
    expect(rules.ddAmount).toBe(2000)
    expect(rules.evalProfitTarget).toBe(3000)
    expect(rules.evalConsistencyPct).toBe(50)
    expect(rules.evalMinProfitDays).toBe(5)
    expect(rules.evalMinProfitAmount).toBe(150)
    expect(rules.fundedConsistencyPct).toBeNull()
    // none should be NaN
    for (const v of Object.values(rules)) {
      expect(Number.isNaN(v as number)).toBe(false)
    }
  })
})
