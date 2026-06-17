import type { TFunction } from "i18next"
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
  t: TFunction<"dashboard">,
): RatioContext {
  const lifetime = computeKpis(
    evaluations,
    fundedAccounts,
    payouts,
    UNBOUNDED_RANGE,
  )

  const toBadge = (
    tooltipAboveKey: "kpi.fundingRatio.badgeTooltipAbove" | "kpi.payoutRatio.badgeTooltipAbove",
    tooltipBelowKey: "kpi.fundingRatio.badgeTooltipBelow" | "kpi.payoutRatio.badgeTooltipBelow",
    current: number,
    lifetimeValue: number,
  ): RatioBadge | null => {
    if (lifetime.totalAttempts === 0) return null
    const above = current >= lifetimeValue
    return {
      value: `~ ${formatPercent(lifetimeValue)}`,
      tone: above ? "default" : "negative",
      tooltip: t(above ? tooltipAboveKey : tooltipBelowKey),
    }
  }

  return {
    fundingBadge: toBadge(
      "kpi.fundingRatio.badgeTooltipAbove",
      "kpi.fundingRatio.badgeTooltipBelow",
      currentFundingRatio,
      lifetime.fundingRatio,
    ),
    payoutBadge: toBadge(
      "kpi.payoutRatio.badgeTooltipAbove",
      "kpi.payoutRatio.badgeTooltipBelow",
      currentPayoutRatio,
      lifetime.payoutRatio,
    ),
  }
}
