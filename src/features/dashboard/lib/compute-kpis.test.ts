import { describe, it, expect } from "vitest"
import { computeKpis, type DashboardKpis } from "@/features/dashboard/lib/compute-kpis"
import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import type { FundedAccount } from "@/features/funded-accounts/api/funded-accounts-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"
import { UNBOUNDED_RANGE } from "@/features/dashboard/lib/period"

// Minimal fixtures — only the fields computeKpis actually reads
function makeEval(fee_paid: string, purchase_date = "2024-01-15"): Evaluation {
  return {
    fee_paid,
    purchase_date,
    resets: [],
  } as unknown as Evaluation
}

function makePayout(amount: string, fee_taken = "0", paid_at = "2024-01-20"): Payout {
  return {
    amount,
    fee_taken,
    paid_at,
    funded_account_id: "fa1",
  } as unknown as Payout
}

const NO_FUNDED: FundedAccount[] = []

describe("computeKpis — ROI", () => {
  it("returns a positive roi when netPnl > 0 and totalSpent > 0", () => {
    // totalSpent = 100 (eval fee), totalPayoutsNet = 600, netPnl = 500
    // roi = 500 / 100 = 5
    const evals = [makeEval("100")]
    const payouts = [makePayout("600", "0")]
    const result: DashboardKpis = computeKpis(evals, NO_FUNDED, payouts, UNBOUNDED_RANGE)
    expect(result.netPnl).toBe(500)
    expect(result.roi).toBeCloseTo(5, 5)
  })

  it("returns a negative roi when netPnl < 0 and totalSpent > 0", () => {
    // totalSpent = 200 (eval fee), no payouts → netPnl = -200
    // roi = -200 / 200 = -1
    const evals = [makeEval("200")]
    const result: DashboardKpis = computeKpis(evals, NO_FUNDED, [], UNBOUNDED_RANGE)
    expect(result.netPnl).toBe(-200)
    expect(result.roi).toBeCloseTo(-1, 5)
  })

  it("returns null roi when totalSpent === 0", () => {
    // No evaluations, no resets → totalSpent = 0
    const result: DashboardKpis = computeKpis([], NO_FUNDED, [], UNBOUNDED_RANGE)
    expect(result.totalSpent).toBe(0)
    expect(result.roi).toBeNull()
  })

  it("returns roi === 0 when netPnl === 0 and totalSpent > 0", () => {
    // totalSpent = 100, totalPayoutsNet = 100 → netPnl = 0
    // roi = 0 / 100 = 0
    const evals = [makeEval("100")]
    const payouts = [makePayout("100", "0")]
    const result: DashboardKpis = computeKpis(evals, NO_FUNDED, payouts, UNBOUNDED_RANGE)
    expect(result.netPnl).toBe(0)
    expect(result.roi).toBe(0)
  })
})
