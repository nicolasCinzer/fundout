import { format, parseISO, startOfMonth } from "date-fns"
import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"

export type MonthlyFlowPoint = {
  month: string
  monthLabel: string
  fees: number
  payouts: number
  net: number
}

export function computeMonthlyFlow(
  evaluations: Evaluation[],
  payouts: Payout[],
): MonthlyFlowPoint[] {
  const buckets = new Map<string, { fees: number; payouts: number }>()

  for (const e of evaluations) {
    const key = format(startOfMonth(parseISO(e.purchase_date)), "yyyy-MM")
    const bucket = buckets.get(key) ?? { fees: 0, payouts: 0 }
    bucket.fees += Number(e.fee_paid)
    buckets.set(key, bucket)
  }

  for (const p of payouts) {
    const key = format(startOfMonth(parseISO(p.paid_at)), "yyyy-MM")
    const bucket = buckets.get(key) ?? { fees: 0, payouts: 0 }
    bucket.payouts += Number(p.amount) - Number(p.fee_taken)
    buckets.set(key, bucket)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bucket]) => ({
      month,
      monthLabel: format(parseISO(`${month}-01`), "MMM yy"),
      fees: bucket.fees,
      payouts: bucket.payouts,
      net: bucket.payouts - bucket.fees,
    }))
}
