import { format, parseISO, startOfMonth } from "date-fns"
import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"
import {
  isDateInRange,
  monthsInRange,
  type DateRange,
} from "@/features/dashboard/lib/period"

export type MonthlyFlowPoint = {
  month: string
  monthLabel: string
  fees: number
  payouts: number
  net: number
  cumulative: number
}

/**
 * Bucket fee and payout activity by month within the range. Reset fees land
 * on the month the reset happened. Cumulative is a running net P&L that
 * resets to 0 at the start of the period.
 *
 * Months with no activity are emitted as zero rows so the line chart stays
 * continuous instead of skipping gaps.
 */
export function computeMonthlyFlow(
  evaluations: Evaluation[],
  payouts: Payout[],
  range: DateRange,
): MonthlyFlowPoint[] {
  const fallbackDates: string[] = []
  for (const e of evaluations) {
    fallbackDates.push(e.purchase_date)
    for (const r of e.resets ?? []) fallbackDates.push(r.reset_at)
  }
  for (const p of payouts) fallbackDates.push(p.paid_at)

  const monthKeys = monthsInRange(range, fallbackDates)
  if (monthKeys.length === 0) return []

  const buckets = new Map<string, { fees: number; payouts: number }>()
  for (const key of monthKeys) buckets.set(key, { fees: 0, payouts: 0 })

  const inRange = (d: string) => isDateInRange(d, range)

  for (const e of evaluations) {
    if (inRange(e.purchase_date)) {
      const key = format(startOfMonth(parseISO(e.purchase_date)), "yyyy-MM")
      const bucket = buckets.get(key)
      if (bucket) bucket.fees += Number(e.fee_paid)
    }
    for (const r of e.resets ?? []) {
      if (inRange(r.reset_at)) {
        const key = format(startOfMonth(parseISO(r.reset_at)), "yyyy-MM")
        const bucket = buckets.get(key)
        if (bucket) bucket.fees += Number(r.fee)
      }
    }
  }

  for (const p of payouts) {
    if (inRange(p.paid_at)) {
      const key = format(startOfMonth(parseISO(p.paid_at)), "yyyy-MM")
      const bucket = buckets.get(key)
      if (bucket) bucket.payouts += Number(p.amount) - Number(p.fee_taken)
    }
  }

  let runningPnl = 0
  return monthKeys.map((key) => {
    const b = buckets.get(key)!
    runningPnl += b.payouts - b.fees
    return {
      month: key,
      monthLabel: format(parseISO(`${key}-01`), "MMM yy"),
      fees: b.fees,
      payouts: b.payouts,
      net: b.payouts - b.fees,
      cumulative: runningPnl,
    }
  })
}
