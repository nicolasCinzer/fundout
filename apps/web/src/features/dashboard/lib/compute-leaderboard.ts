import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import type { FundedAccount } from "@/features/funded-accounts/api/funded-accounts-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"
import { isDateInRange, type DateRange } from "@/features/dashboard/lib/period"

export type LeaderboardRow = {
  propfirmId: string
  propfirmName: string
  evaluationsCount: number
  resetsCount: number
  attemptsCount: number
  fundedCount: number
  paidOutCount: number
  totalFees: number
  totalPayoutsNet: number
  netPnl: number
}

/**
 * Per-propfirm aggregation, filtered to events that happened within range.
 * Same event-by-its-own-date semantics as computeKpis. A propfirm only
 * appears if it has at least one evaluation in the period.
 */
export function computeLeaderboard(
  evaluations: Evaluation[],
  fundedAccounts: FundedAccount[],
  payouts: Payout[],
  range: DateRange,
): LeaderboardRow[] {
  const inRange = (d: string) => isDateInRange(d, range)

  // Index funded accounts by their evaluation's propfirm. We'll need this
  // to attribute payouts back to a propfirm.
  const propfirmByFundedId = new Map<string, string | null>()
  for (const fa of fundedAccounts) {
    propfirmByFundedId.set(fa.id, fa.evaluation?.propfirm_id ?? null)
  }

  type Bucket = {
    propfirmName: string
    evalIds: Set<string>
    resetsCount: number
    fundedIds: Set<string>
    paidOutFundedIds: Set<string>
    totalFees: number
    totalPayoutsNet: number
  }
  const buckets = new Map<string, Bucket>()

  const bucketFor = (propfirmId: string, propfirmName: string): Bucket => {
    let b = buckets.get(propfirmId)
    if (!b) {
      b = {
        propfirmName,
        evalIds: new Set(),
        resetsCount: 0,
        fundedIds: new Set(),
        paidOutFundedIds: new Set(),
        totalFees: 0,
        totalPayoutsNet: 0,
      }
      buckets.set(propfirmId, b)
    }
    return b
  }

  // Evaluations + reset fees, by their own dates
  for (const e of evaluations) {
    if (!e.propfirm) continue
    const b = bucketFor(e.propfirm.id, e.propfirm.name)

    if (inRange(e.purchase_date)) {
      b.evalIds.add(e.id)
      b.totalFees += Number(e.fee_paid)
    }
    for (const r of e.resets ?? []) {
      if (inRange(r.reset_at)) {
        // Ensure the eval is at least tracked when only the reset is in range.
        b.evalIds.add(e.id)
        b.totalFees += Number(r.fee)
        b.resetsCount += 1
      }
    }
  }

  // Funded accounts that started in period
  for (const fa of fundedAccounts) {
    if (!isDateInRange(fa.start_date, range)) continue
    const propfirmId = fa.evaluation?.propfirm?.id
    const propfirmName = fa.evaluation?.propfirm?.name
    if (!propfirmId || !propfirmName) continue
    const b = bucketFor(propfirmId, propfirmName)
    b.fundedIds.add(fa.id)
  }

  // Payouts in period, attributed to the propfirm via funded → evaluation
  for (const p of payouts) {
    if (!isDateInRange(p.paid_at, range)) continue
    const propfirmId =
      p.funded_account?.evaluation?.propfirm?.id ??
      propfirmByFundedId.get(p.funded_account_id) ??
      null
    const propfirmName = p.funded_account?.evaluation?.propfirm?.name
    if (!propfirmId || !propfirmName) continue
    const b = bucketFor(propfirmId, propfirmName)
    b.paidOutFundedIds.add(p.funded_account_id)
    b.totalPayoutsNet += Number(p.amount) - Number(p.fee_taken)
  }

  return Array.from(buckets.entries())
    .map(([propfirmId, b]) => ({
      propfirmId,
      propfirmName: b.propfirmName,
      evaluationsCount: b.evalIds.size,
      resetsCount: b.resetsCount,
      attemptsCount: b.evalIds.size + b.resetsCount,
      fundedCount: b.fundedIds.size,
      paidOutCount: b.paidOutFundedIds.size,
      totalFees: b.totalFees,
      totalPayoutsNet: b.totalPayoutsNet,
      netPnl: b.totalPayoutsNet - b.totalFees,
    }))
    .filter(
      (r) => r.evaluationsCount > 0 || r.fundedCount > 0 || r.paidOutCount > 0,
    )
    .sort((a, b) => b.netPnl - a.netPnl)
}
