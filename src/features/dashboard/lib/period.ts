import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  parseISO,
  setMonth,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
  subYears,
} from "date-fns"

export const PERIODS = [
  "all_time",
  "this_month",
  "last_month",
  "this_year",
  "last_year",
  "last_12_months",
  "q1",
  "q2",
  "q3",
  "q4",
  "custom",
] as const

export type Period = (typeof PERIODS)[number]

export const DEFAULT_PERIOD: Period = "this_year"

export const PERIOD_LABEL: Record<Period, string> = {
  all_time: "All time",
  this_month: "This month",
  last_month: "Last month",
  this_year: "This year",
  last_year: "Last year",
  last_12_months: "Last 12 months",
  q1: "Q1 — First quarter",
  q2: "Q2 — Second quarter",
  q3: "Q3 — Third quarter",
  q4: "Q4 — Final quarter",
  custom: "Custom range",
}

export type DateRange = {
  start: Date | null
  end: Date | null
}

export type CustomRange = {
  from?: string
  to?: string
}

/** Open-ended range = unbounded both sides. */
export const UNBOUNDED_RANGE: DateRange = { start: null, end: null }

function quarterRange(quarterIndex: 0 | 1 | 2 | 3, now: Date): DateRange {
  const firstMonth = quarterIndex * 3
  const anchor = setMonth(startOfYear(now), firstMonth)
  return { start: startOfQuarter(anchor), end: endOfQuarter(anchor) }
}

export function periodRange(
  period: Period,
  now: Date = new Date(),
  custom?: CustomRange,
): DateRange {
  switch (period) {
    case "all_time":
      return UNBOUNDED_RANGE
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case "last_month": {
      const prev = subMonths(now, 1)
      return { start: startOfMonth(prev), end: endOfMonth(prev) }
    }
    case "this_year":
      return { start: startOfYear(now), end: endOfYear(now) }
    case "last_year": {
      const prev = subYears(now, 1)
      return { start: startOfYear(prev), end: endOfYear(prev) }
    }
    case "last_12_months":
      return {
        start: startOfMonth(subMonths(now, 11)),
        end: endOfMonth(now),
      }
    case "q1":
      return quarterRange(0, now)
    case "q2":
      return quarterRange(1, now)
    case "q3":
      return quarterRange(2, now)
    case "q4":
      return quarterRange(3, now)
    case "custom": {
      const start = custom?.from
        ? startOfDay(parseISO(custom.from))
        : startOfMonth(now)
      const end = custom?.to
        ? endOfDay(parseISO(custom.to))
        : endOfMonth(now)
      return { start, end }
    }
  }
}

export function periodSubtitle(
  period: Period,
  range: DateRange,
): string {
  const label = PERIOD_LABEL[period]
  if (!range.start || !range.end) return label
  return `${label} (${format(range.start, "MMM d, yyyy")} – ${format(range.end, "MMM d, yyyy")})`
}

export function isDateInRange(dateStr: string, range: DateRange): boolean {
  if (!range.start && !range.end) return true
  const d = parseISO(dateStr)
  if (range.start && d < range.start) return false
  if (range.end && d > range.end) return false
  return true
}

/**
 * Return every day in the range as "yyyy-MM-dd" strings, inclusive.
 * For unbounded the span is derived from the supplied dates;
 * if no dates exist, returns an empty array.
 *
 * Day-level granularity is what the flow chart bucket on. Periods like
 * "this_month" become a real 30-ish-point line instead of a single dot.
 */
export function daysInRange(
  range: DateRange,
  fallbackDates: string[],
): string[] {
  let start = range.start
  let end = range.end

  if (!start || !end) {
    if (fallbackDates.length === 0) return []
    const sorted = [...fallbackDates].sort()
    start = start ?? startOfDay(parseISO(sorted[0]))
    end = end ?? endOfDay(parseISO(sorted[sorted.length - 1]))
  }

  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"))
}
