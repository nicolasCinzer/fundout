import {
  totalFee,
  type Evaluation,
} from "@/features/evaluations/api/evaluations-queries"
import type { FundedAccount } from "@/features/funded-accounts/api/funded-accounts-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"

export type DashboardKpis = {
  totalSpent: number
  totalPayoutsGross: number
  totalPayoutsNet: number
  netPnl: number
  fundingRatio: number
  payoutRatio: number
  activeFunded: number
  totalEvaluations: number
  countFunded: number
  countWithPayouts: number
}

export function computeKpis(
  evaluations: Evaluation[],
  fundedAccounts: FundedAccount[],
  payouts: Payout[],
): DashboardKpis {
  // total spent = base fees + every reset fee across all evaluations
  const totalSpent = evaluations.reduce((acc, e) => acc + totalFee(e), 0)
  const totalPayoutsGross = payouts.reduce(
    (acc, p) => acc + Number(p.amount),
    0,
  )
  const totalPayoutsNet = payouts.reduce(
    (acc, p) => acc + (Number(p.amount) - Number(p.fee_taken)),
    0,
  )
  const netPnl = totalPayoutsNet - totalSpent

  // Funding ratio = funded / total evaluations. With resets in the mix and
  // 'refunded' gone, every evaluation counts toward the denominator.
  const countFunded = fundedAccounts.length
  const fundingRatio =
    evaluations.length === 0 ? 0 : countFunded / evaluations.length

  const fundedWithPayouts = new Set(
    payouts
      .map((p) => p.funded_account_id)
      .filter((id): id is string => !!id),
  )
  const countWithPayouts = fundedWithPayouts.size
  const payoutRatio =
    countFunded === 0 ? 0 : countWithPayouts / countFunded

  const activeFunded = fundedAccounts.filter(
    (f) => f.status === "active",
  ).length

  return {
    totalSpent,
    totalPayoutsGross,
    totalPayoutsNet,
    netPnl,
    fundingRatio,
    payoutRatio,
    activeFunded,
    totalEvaluations: evaluations.length,
    countFunded,
    countWithPayouts,
  }
}
