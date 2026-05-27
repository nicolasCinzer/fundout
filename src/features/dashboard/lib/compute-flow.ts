import { format, parseISO } from "date-fns"
import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"
import {
  daysInRange,
  isDateInRange,
  type DateRange,
} from "@/features/dashboard/lib/period"

export type FlowPoint = {
  day: string // yyyy-MM-dd, used as the X axis value and React key
  dayLabel: string // human-readable, e.g. "Mar 5"
  fees: number
  payouts: number
  net: number
  cumulative: number
}

/**
 * Day-level activity within the range, with a continuous skeleton so the
 * chart's X axis is dense and uniform (one entry per day). Cumulative is
 * a running net P&L within the period, starting at 0 on day 1.
 */
export function computeFlow(
  evaluations: Evaluation[],
  payouts: Payout[],
  range: DateRange,
): FlowPoint[] {
  const fallbackDates: string[] = []
  for (const e of evaluations) {
    fallbackDates.push(e.purchase_date)
    for (const r of e.resets ?? []) fallbackDates.push(r.reset_at)
  }
  for (const p of payouts) fallbackDates.push(p.paid_at)

  const dayKeys = daysInRange(range, fallbackDates)
  if (dayKeys.length === 0) return []

  const buckets = new Map<string, { fees: number; payouts: number }>()
  for (const key of dayKeys) buckets.set(key, { fees: 0, payouts: 0 })

  const inRange = (d: string) => isDateInRange(d, range)

  for (const e of evaluations) {
    if (inRange(e.purchase_date)) {
      const bucket = buckets.get(e.purchase_date)
      if (bucket) bucket.fees += Number(e.fee_paid)
    }
    for (const r of e.resets ?? []) {
      if (inRange(r.reset_at)) {
        const bucket = buckets.get(r.reset_at)
        if (bucket) bucket.fees += Number(r.fee)
      }
    }
  }

  for (const p of payouts) {
    if (inRange(p.paid_at)) {
      const bucket = buckets.get(p.paid_at)
      if (bucket) bucket.payouts += Number(p.amount) - Number(p.fee_taken)
    }
  }

  let runningPnl = 0
  return dayKeys.map((day) => {
    const b = buckets.get(day)!
    runningPnl += b.payouts - b.fees
    return {
      day,
      dayLabel: format(parseISO(day), "MMM d"),
      fees: b.fees,
      payouts: b.payouts,
      net: b.payouts - b.fees,
      cumulative: runningPnl,
    }
  })
}
