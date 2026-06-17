import { describe, it, expect } from "vitest"
import {
  backtestCreateSchema,
  backtestRenameSchema,
  backtestEventAppendSchema,
} from "./backtest-form-schema"

describe("backtestCreateSchema", () => {
  it("accepts valid input", () => {
    const result = backtestCreateSchema.safeParse({
      name: "Run A",
      bankroll_initial: 10000,
      eval_cost: 100,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = backtestCreateSchema.safeParse({
      name: "",
      bankroll_initial: 1000,
      eval_cost: 100,
    })
    expect(result.success).toBe(false)
  })

  it("rejects whitespace-only name (trim then min 1)", () => {
    const result = backtestCreateSchema.safeParse({
      name: "   ",
      bankroll_initial: 1000,
      eval_cost: 100,
    })
    expect(result.success).toBe(false)
  })

  it("rejects name longer than 80 chars", () => {
    const result = backtestCreateSchema.safeParse({
      name: "a".repeat(81),
      bankroll_initial: 1000,
      eval_cost: 100,
    })
    expect(result.success).toBe(false)
  })

  it("accepts name exactly 80 chars", () => {
    const result = backtestCreateSchema.safeParse({
      name: "a".repeat(80),
      bankroll_initial: 1000,
      eval_cost: 100,
    })
    expect(result.success).toBe(true)
  })

  it("rejects negative bankroll_initial", () => {
    const result = backtestCreateSchema.safeParse({
      name: "Run",
      bankroll_initial: -1,
      eval_cost: 100,
    })
    expect(result.success).toBe(false)
  })

  it("accepts bankroll_initial = 0", () => {
    const result = backtestCreateSchema.safeParse({
      name: "Run",
      bankroll_initial: 0,
      eval_cost: 100,
    })
    expect(result.success).toBe(true)
  })

  it("rejects zero eval_cost", () => {
    const result = backtestCreateSchema.safeParse({
      name: "Run",
      bankroll_initial: 1000,
      eval_cost: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative eval_cost", () => {
    const result = backtestCreateSchema.safeParse({
      name: "Run",
      bankroll_initial: 1000,
      eval_cost: -50,
    })
    expect(result.success).toBe(false)
  })

  it("coerces string numbers for bankroll_initial and eval_cost", () => {
    const result = backtestCreateSchema.safeParse({
      name: "Run",
      bankroll_initial: "10000",
      eval_cost: "100",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.bankroll_initial).toBe(10000)
      expect(result.data.eval_cost).toBe(100)
    }
  })
})

describe("backtestRenameSchema", () => {
  it("accepts valid name", () => {
    expect(backtestRenameSchema.safeParse({ name: "New name" }).success).toBe(true)
  })

  it("rejects empty name", () => {
    expect(backtestRenameSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("rejects name over 80 chars", () => {
    expect(backtestRenameSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false)
  })
})

describe("backtestEventAppendSchema — type E", () => {
  it("accepts type=E with no amount", () => {
    const result = backtestEventAppendSchema.safeParse({ type: "E" })
    expect(result.success).toBe(true)
  })

  it("accepts type=E with optional notes", () => {
    const result = backtestEventAppendSchema.safeParse({
      type: "E",
      notes: "Some note",
    })
    expect(result.success).toBe(true)
  })
})

describe("backtestEventAppendSchema — type F", () => {
  it("accepts type=F with no amount", () => {
    const result = backtestEventAppendSchema.safeParse({ type: "F" })
    expect(result.success).toBe(true)
  })
})

describe("backtestEventAppendSchema — type P", () => {
  it("accepts type=P with positive amount", () => {
    const result = backtestEventAppendSchema.safeParse({
      type: "P",
      amount: 500,
    })
    expect(result.success).toBe(true)
  })

  it("rejects type=P with amount=0", () => {
    const result = backtestEventAppendSchema.safeParse({
      type: "P",
      amount: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects type=P with negative amount", () => {
    const result = backtestEventAppendSchema.safeParse({
      type: "P",
      amount: -50,
    })
    expect(result.success).toBe(false)
  })

  it("rejects type=P with missing amount", () => {
    const result = backtestEventAppendSchema.safeParse({
      type: "P",
    })
    expect(result.success).toBe(false)
  })

  it("coerces string amount for type=P", () => {
    const result = backtestEventAppendSchema.safeParse({
      type: "P",
      amount: "500",
    })
    expect(result.success).toBe(true)
    if (result.success && result.data.type === "P") {
      expect(result.data.amount).toBe(500)
    }
  })
})
