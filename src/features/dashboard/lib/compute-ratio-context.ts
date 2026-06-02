import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import type { FundedAccount } from "@/features/funded-accounts/api/funded-accounts-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"
import { formatPercent } from "@/lib/format"
import { UNBOUNDED_RANGE, type Period } from "./period"
import { computeKpis } from "./compute-kpis"

export type RatioBadge = {
  value: string
  tone: "default" | "negative"
  tooltip: string
}

export type RatioContext = {
  fundingBadge: RatioBadge | null
  payoutBadge: RatioBadge | null
}

/**
 * Lifetime ratios are the long-run baseline. The period card's badge compares
 * current ratio against that baseline: above → tone "default" (primary),
 * below → tone "negative" (muted rose).
 */
export function computeRatioContext(
  evaluations: Evaluation[],
  fundedAccounts: FundedAccount[],
  payouts: Payout[],
  _period: Period,
  currentFundingRatio: number,
  currentPayoutRatio: number,
): RatioContext {
  const lifetime = computeKpis(
    evaluations,
    fundedAccounts,
    payouts,
    UNBOUNDED_RANGE,
  )

  const toBadge = (
    label: string,
    current: number,
    lifetimeValue: number,
  ): RatioBadge | null => {
    if (lifetime.totalAttempts === 0) return null
    const above = current >= lifetimeValue
    return {
      value: `~ ${formatPercent(lifetimeValue)}`,
      tone: above ? "default" : "negative",
      tooltip: `Your lifetime ${label} across all attempts. ${
        above
          ? "You're above your baseline this period."
          : "You're below your baseline this period."
      }`,
    }
  }

  return {
    fundingBadge: toBadge(
      "funding ratio",
      currentFundingRatio,
      lifetime.fundingRatio,
    ),
    payoutBadge: toBadge(
      "payout ratio",
      currentPayoutRatio,
      lifetime.payoutRatio,
    ),
  }
}
