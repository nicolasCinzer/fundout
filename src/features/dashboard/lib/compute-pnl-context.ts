import {
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns"
import type { Evaluation } from "@/features/evaluations/api/evaluations-queries"
import type { Payout } from "@/features/payouts/api/payouts-queries"
import { formatCurrency } from "@/lib/format"
import {
  isDateInRange,
  periodRange,
  type DateRange,
  type Period,
} from "./period"

export type PnlContext = {
  badge: string | null
  badgeTooltip: string | null
  subtitle: string
}

function netPnlForRange(
  evaluations: Evaluation[],
  payouts: Payout[],
  range: DateRange,
): number {
  let spent = 0
  for (const e of evaluations) {
    if (isDateInRange(e.purchase_date, range)) spent += Number(e.fee_paid)
    for (const r of e.resets ?? []) {
      if (isDateInRange(r.reset_at, range)) spent += Number(r.fee)
    }
  }
  let net = 0
  for (const p of payouts) {
    if (isDateInRange(p.paid_at, range)) {
      net += Number(p.amount) - Number(p.fee_taken)
    }
  }
  return net - spent
}

// Bucket every event by its own month key ("yyyy-MM") and accumulate net P&L.
function monthlyBuckets(
  evaluations: Evaluation[],
  payouts: Payout[],
): Map<string, number> {
  const buckets = new Map<string, number>()
  const add = (key: string, delta: number) =>
    buckets.set(key, (buckets.get(key) ?? 0) + delta)

  for (const e of evaluations) {
    add(e.purchase_date.slice(0, 7), -Number(e.fee_paid))
    for (const r of e.resets ?? []) {
      add(r.reset_at.slice(0, 7), -Number(r.fee))
    }
  }
  for (const p of payouts) {
    add(p.paid_at.slice(0, 7), Number(p.amount) - Number(p.fee_taken))
  }
  return buckets
}

function previousRange(period: Period, now: Date): DateRange | null {
  switch (period) {
    case "this_month": {
      const prev = subMonths(now, 1)
      return { start: startOfMonth(prev), end: endOfMonth(prev) }
    }
    case "this_year": {
      const prev = subYears(now, 1)
      return { start: startOfYear(prev), end: endOfYear(prev) }
    }
    case "last_12_months": {
      return {
        start: startOfMonth(subMonths(now, 23)),
        end: endOfMonth(subMonths(now, 12)),
      }
    }
    case "all_time":
      return null
  }
}

function formatDeltaPct(current: number, previous: number): string | null {
  if (previous === 0) return null
  const pct = ((current - previous) / Math.abs(previous)) * 100
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}%`
}

function ordinal(n: number): string {
  const j = n % 10
  const k = n % 100
  if (j === 1 && k !== 11) return `${n}st`
  if (j === 2 && k !== 12) return `${n}nd`
  if (j === 3 && k !== 13) return `${n}rd`
  return `${n}th`
}

function formatMonthKey(key: string, includeYear: boolean): string {
  const date = parseISO(`${key}-01`)
  return format(date, includeYear ? "MMM yyyy" : "MMMM")
}

export function computePnlContext(
  evaluations: Evaluation[],
  payouts: Payout[],
  period: Period,
  now: Date = new Date(),
): PnlContext {
  const buckets = Array.from(monthlyBuckets(evaluations, payouts).entries())
  const currentMonthKey = format(now, "yyyy-MM")
  const currentYearKey = format(now, "yyyy")

  // ── Badge ────────────────────────────────────────────────────────────────
  let badge: string | null = null
  let badgeTooltip: string | null = null
  if (period === "all_time") {
    if (buckets.length > 0) {
      const total = buckets.reduce((acc, [, v]) => acc + v, 0)
      const avg = total / buckets.length
      badge = `~ ${formatCurrency(avg)}`
      badgeTooltip = "Your average net P&L per tracked month."
    }
  } else {
    const prev = previousRange(period, now)
    if (prev) {
      const prevPnl = netPnlForRange(evaluations, payouts, prev)
      const currentPnl = netPnlForRange(
        evaluations,
        payouts,
        periodRange(period, now),
      )
      badge = formatDeltaPct(currentPnl, prevPnl)
      if (badge) {
        const label =
          period === "this_month"
            ? "previous month"
            : period === "this_year"
              ? "previous year"
              : "the prior 12 months"
        badgeTooltip = `Net P&L change vs ${label} (${formatCurrency(prevPnl)}).`
      }
    }
  }

  // ── Subtitle ─────────────────────────────────────────────────────────────
  let subtitle = ""
  if (period === "this_month") {
    const sorted = [...buckets].sort((a, b) => b[1] - a[1])
    const idx = sorted.findIndex(([k]) => k === currentMonthKey)
    if (idx < 0) {
      subtitle = "No activity recorded for this month"
    } else if (sorted.length === 1) {
      subtitle = "Your only tracked month so far"
    } else if (idx === 0) {
      subtitle = "This is your best month so far"
    } else {
      subtitle = `This is your ${ordinal(idx + 1)} best month so far`
    }
  } else if (period === "this_year") {
    const yearMonths = buckets.filter(([k]) => k.startsWith(currentYearKey))
    if (yearMonths.length === 0) {
      subtitle = "No activity recorded for this year"
    } else {
      const best = yearMonths.reduce((a, b) => (b[1] > a[1] ? b : a))
      subtitle = `Best month this year: ${formatMonthKey(best[0], false)} (${formatCurrency(best[1])})`
    }
  } else if (period === "last_12_months") {
    const range = periodRange("last_12_months", now)
    const windowMonths = buckets.filter(([k]) => {
      const d = parseISO(`${k}-01`)
      if (range.start && d < range.start) return false
      if (range.end && d > range.end) return false
      return true
    })
    if (windowMonths.length === 0) {
      subtitle = "No activity in this window"
    } else {
      const best = windowMonths.reduce((a, b) => (b[1] > a[1] ? b : a))
      subtitle = `Best month in window: ${formatMonthKey(best[0], true)} (${formatCurrency(best[1])})`
    }
  } else {
    if (buckets.length === 0) {
      subtitle = "No activity recorded yet"
    } else {
      const best = buckets.reduce((a, b) => (b[1] > a[1] ? b : a))
      subtitle = `Best month ever: ${formatMonthKey(best[0], true)} (${formatCurrency(best[1])})`
    }
  }

  return { badge, badgeTooltip, subtitle }
}
