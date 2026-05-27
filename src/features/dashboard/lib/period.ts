import {
  eachMonthOfInterval,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns"

export const PERIODS = [
  "this_month",
  "this_year",
  "last_12_months",
  "all_time",
] as const

export type Period = (typeof PERIODS)[number]

export const DEFAULT_PERIOD: Period = "this_year"

export const PERIOD_LABEL: Record<Period, string> = {
  this_month: "This month",
  this_year: "This year",
  last_12_months: "Last 12 months",
  all_time: "All time",
}

export type DateRange = {
  start: Date | null
  end: Date | null
}

/** Open-ended range = unbounded both sides. */
export const UNBOUNDED_RANGE: DateRange = { start: null, end: null }

export function periodRange(
  period: Period,
  now: Date = new Date(),
): DateRange {
  switch (period) {
    case "this_month":
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case "this_year":
      return { start: startOfYear(now), end: endOfYear(now) }
    case "last_12_months":
      return {
        start: startOfMonth(subMonths(now, 11)),
        end: endOfMonth(now),
      }
    case "all_time":
      return UNBOUNDED_RANGE
  }
}

export function isDateInRange(dateStr: string, range: DateRange): boolean {
  if (!range.start && !range.end) return true
  const d = parseISO(dateStr)
  if (range.start && d < range.start) return false
  if (range.end && d > range.end) return false
  return true
}

/**
 * Return every month in the range as "yyyy-MM" strings, inclusive.
 * For unbounded (all_time) the span is derived from the supplied dates;
 * if no dates exist, returns an empty array.
 */
export function monthsInRange(
  range: DateRange,
  fallbackDates: string[],
): string[] {
  let start = range.start
  let end = range.end

  if (!start || !end) {
    if (fallbackDates.length === 0) return []
    const sorted = [...fallbackDates].sort()
    start = start ?? startOfMonth(parseISO(sorted[0]))
    end = end ?? endOfMonth(parseISO(sorted[sorted.length - 1]))
  }

  return eachMonthOfInterval({ start, end }).map((d) => format(d, "yyyy-MM"))
}
