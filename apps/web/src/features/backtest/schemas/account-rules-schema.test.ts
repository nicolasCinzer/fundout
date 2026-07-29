import { describe, it, expect } from "vitest"
import { accountRulesSchema } from "./account-rules-schema"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FULL_CORE = {
  dd_starting_balance: 50000,
  dd_amount: 2000,
  dd_type: "EOD" as const,
  eval_profit_target: 3000,
}

const FULL_ADDONS = {
  eval_consistency_pct: 0.5,
  eval_min_profit_days: 5,
  eval_min_profit_amount: 200,
  funded_consistency_pct: 0.4,
  funded_min_profit_days: 5,
  funded_min_profit_amount: 150,
}

// ---------------------------------------------------------------------------
// SCENARIO DB-1: full CORE + add-ons → passes
// ---------------------------------------------------------------------------
describe("accountRulesSchema — SCENARIO DB-1: full CORE + all add-ons", () => {
  it("accepts complete CORE with all optional add-ons set", () => {
    const result = accountRulesSchema.safeParse({ ...FULL_CORE, ...FULL_ADDONS })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// SCENARIO DB-2: partial CORE → Zod error, no DB call
// ---------------------------------------------------------------------------
describe("accountRulesSchema — SCENARIO DB-2: partial CORE rejected", () => {
  it("rejects when dd_type and eval_profit_target are missing", () => {
    const result = accountRulesSchema.safeParse({
      dd_starting_balance: 50000,
      dd_amount: 2000,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."))
      expect(paths).toContain("dd_type")
      expect(paths).toContain("eval_profit_target")
    }
  })

  it("rejects when only dd_starting_balance is provided", () => {
    const result = accountRulesSchema.safeParse({ dd_starting_balance: 50000 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."))
      expect(paths).toContain("dd_amount")
      expect(paths).toContain("dd_type")
      expect(paths).toContain("eval_profit_target")
    }
  })
})

// ---------------------------------------------------------------------------
// SCENARIO DB-3: CORE only, no add-ons → passes
// ---------------------------------------------------------------------------
describe("accountRulesSchema — SCENARIO DB-3: CORE only, no add-ons", () => {
  it("accepts CORE with no optional add-ons", () => {
    const result = accountRulesSchema.safeParse(FULL_CORE)
    expect(result.success).toBe(true)
  })

  it("accepts CORE with explicit null add-ons", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      eval_consistency_pct: null,
      funded_consistency_pct: null,
      funded_min_profit_days: null,
      funded_min_profit_amount: null,
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// SCENARIO DB-4: eval_consistency_pct only (no funded add-ons) → passes
// ---------------------------------------------------------------------------
describe("accountRulesSchema — SCENARIO DB-4: eval consistency only", () => {
  it("accepts CORE + eval_consistency_pct with funded add-ons null", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      eval_consistency_pct: 0.5,
      funded_consistency_pct: null,
      funded_min_profit_days: null,
      funded_min_profit_amount: null,
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// SCENARIO DB-5: pairing violation — funded_min_profit_days without amount
// ---------------------------------------------------------------------------
describe("accountRulesSchema — SCENARIO DB-5: pairing violation", () => {
  it("rejects funded_min_profit_days without funded_min_profit_amount", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      funded_min_profit_days: 5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."))
      expect(paths).toContain("funded_min_profit_amount")
    }
  })

  it("rejects funded_min_profit_amount without funded_min_profit_days (inverse pairing)", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      funded_min_profit_amount: 150,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."))
      expect(paths).toContain("funded_min_profit_days")
    }
  })
})

// ---------------------------------------------------------------------------
// SCENARIO DB-7: dd_type='Static' → Zod error
// ---------------------------------------------------------------------------
describe("accountRulesSchema — SCENARIO DB-7: invalid dd_type", () => {
  it("rejects dd_type='Static'", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      dd_type: "Static",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."))
      expect(paths).toContain("dd_type")
    }
  })
})

// ---------------------------------------------------------------------------
// pct value boundary tests
// ---------------------------------------------------------------------------
describe("accountRulesSchema — pct value boundaries", () => {
  it("rejects eval_consistency_pct = 0 (must be > 0)", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      eval_consistency_pct: 0,
    })
    expect(result.success).toBe(false)
  })

  it("accepts eval_consistency_pct = 1 (max boundary)", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      eval_consistency_pct: 1,
    })
    expect(result.success).toBe(true)
  })

  it("rejects eval_consistency_pct = 1.1 (above max)", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      eval_consistency_pct: 1.1,
    })
    expect(result.success).toBe(false)
  })

  it("rejects funded_consistency_pct = 0", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      funded_consistency_pct: 0,
    })
    expect(result.success).toBe(false)
  })

  it("accepts funded_consistency_pct = 1", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      funded_consistency_pct: 1,
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// all-or-nothing CORE: all null → passes (no tracking for this backtest)
// ---------------------------------------------------------------------------
describe("accountRulesSchema — all CORE null (no rules set)", () => {
  it("accepts when all four CORE fields are absent (no tracking)", () => {
    const result = accountRulesSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts when all four CORE fields are explicitly null", () => {
    const result = accountRulesSchema.safeParse({
      dd_starting_balance: null,
      dd_amount: null,
      dd_type: null,
      eval_profit_target: null,
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// SCENARIO DB-8: eval_min_profit_days pairing violation
// ---------------------------------------------------------------------------
describe("accountRulesSchema — SCENARIO DB-8: eval pairing violation", () => {
  it("rejects eval_min_profit_days without eval_min_profit_amount", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      eval_min_profit_days: 5,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."))
      expect(paths).toContain("eval_min_profit_amount")
    }
  })

  it("rejects eval_min_profit_amount without eval_min_profit_days (inverse)", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      eval_min_profit_amount: 200,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."))
      expect(paths).toContain("eval_min_profit_days")
    }
  })

  it("accepts both eval_min_profit_days and eval_min_profit_amount together", () => {
    const result = accountRulesSchema.safeParse({
      ...FULL_CORE,
      eval_min_profit_days: 5,
      eval_min_profit_amount: 200,
    })
    expect(result.success).toBe(true)
  })

  it("accepts CORE + all add-ons including eval pair", () => {
    const result = accountRulesSchema.safeParse({ ...FULL_CORE, ...FULL_ADDONS })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// number coercion
// ---------------------------------------------------------------------------
describe("accountRulesSchema — number coercion", () => {
  it("coerces string numbers", () => {
    const result = accountRulesSchema.safeParse({
      dd_starting_balance: "50000",
      dd_amount: "2000",
      dd_type: "EOD",
      eval_profit_target: "3000",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dd_starting_balance).toBe(50000)
      expect(result.data.dd_amount).toBe(2000)
      expect(result.data.eval_profit_target).toBe(3000)
    }
  })
})
