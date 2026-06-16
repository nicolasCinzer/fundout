import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import type { FundedAccount } from "@/features/funded-accounts/api/funded-accounts-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"
import { isDateInRange, type DateRange } from "@/features/dashboard/lib/period"

export type DashboardKpis = {
  totalSpent: number
  totalPayoutsGross: number
  totalPayoutsNet: number
  avgPayoutNet: number
  countPayouts: number
  netPnl: number
  /** null when totalSpent === 0; otherwise netPnl / totalSpent */
  roi: number | null
  fundingRatio: number
  payoutRatio: number
  activeFunded: number
  totalEvaluations: number
  totalResets: number
  totalAttempts: number
  avgCostPerAttempt: number
  countFunded: number
  countWithPayouts: number
}

/**
 * Aggregate KPIs filtered by date range. Each event is filtered by its own
 * natural date (purchase_date for evaluations, reset_at for resets,
 * start_date for funded accounts, paid_at for payouts). That means a reset
 * happening in Feb 2026 on an evaluation purchased in Dec 2025 counts toward
 * 2026's spend but the original purchase does not.
 */
export function computeKpis(
  evaluations: Evaluation[],
  fundedAccounts: FundedAccount[],
  payouts: Payout[],
  range: DateRange,
): DashboardKpis {
  // Evaluations whose purchase fell in the period
  const evalsInPeriod = evaluations.filter((e) =>
    isDateInRange(e.purchase_date, range),
  )

  // Total spent = base fees of in-period evals + reset fees that happened
  // in-period (regardless of when the parent eval was purchased)
  let totalSpent = evalsInPeriod.reduce(
    (acc, e) => acc + Number(e.fee_paid),
    0,
  )
  let totalResets = 0
  for (const e of evaluations) {
    for (const r of e.resets ?? []) {
      if (isDateInRange(r.reset_at, range)) {
        totalSpent += Number(r.fee)
        totalResets += 1
      }
    }
  }

  const payoutsInPeriod = payouts.filter((p) =>
    isDateInRange(p.paid_at, range),
  )
  const totalPayoutsGross = payoutsInPeriod.reduce(
    (acc, p) => acc + Number(p.amount),
    0,
  )
  const totalPayoutsNet = payoutsInPeriod.reduce(
    (acc, p) => acc + (Number(p.amount) - Number(p.fee_taken)),
    0,
  )
  const avgPayoutNet =
    payoutsInPeriod.length === 0
      ? 0
      : totalPayoutsNet / payoutsInPeriod.length
  const netPnl = totalPayoutsNet - totalSpent
  const roi: number | null = totalSpent > 0 ? netPnl / totalSpent : null

  const fundedInPeriod = fundedAccounts.filter((f) =>
    isDateInRange(f.start_date, range),
  )
  const countFunded = fundedInPeriod.length
  const totalEvaluations = evalsInPeriod.length
  const totalAttempts = totalEvaluations + totalResets
  const avgCostPerAttempt =
    totalAttempts === 0 ? 0 : totalSpent / totalAttempts
  const fundingRatio =
    totalAttempts === 0 ? 0 : countFunded / totalAttempts

  // Distinct funded accounts that received at least one payout in-period
  const fundedWithPayouts = new Set(
    payoutsInPeriod
      .map((p) => p.funded_account_id)
      .filter((id): id is string => !!id),
  )
  const countWithPayouts = fundedWithPayouts.size
  const payoutRatio =
    totalAttempts === 0 ? 0 : countWithPayouts / totalAttempts

  const activeFunded = fundedInPeriod.filter(
    (f) => f.status === "active",
  ).length

  return {
    totalSpent,
    totalPayoutsGross,
    totalPayoutsNet,
    avgPayoutNet,
    countPayouts: payoutsInPeriod.length,
    netPnl,
    roi,
    fundingRatio,
    payoutRatio,
    activeFunded,
    totalEvaluations,
    totalResets,
    totalAttempts,
    avgCostPerAttempt,
    countFunded,
    countWithPayouts,
  }
}
