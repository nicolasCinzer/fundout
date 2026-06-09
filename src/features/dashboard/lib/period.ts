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
  type Locale as DateFnsLocale,
} from "date-fns"
import type { TFunction } from "i18next"

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

/**
 * Returns the translated label for a period.
 * Pass `t` from `useTranslation('dashboard')`.
 */
export function periodLabel(t: TFunction<"dashboard">, period: Period): string {
  const keyMap: Record<Period, string> = {
    all_time: t("period.allTime"),
    this_month: t("period.thisMonth"),
    last_month: t("period.lastMonth"),
    this_year: t("period.thisYear"),
    last_year: t("period.lastYear"),
    last_12_months: t("period.last12Months"),
    q1: t("period.q1"),
    q2: t("period.q2"),
    q3: t("period.q3"),
    q4: t("period.q4"),
    custom: t("period.custom"),
  }
  return keyMap[period]
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
  options?: {
    /** Translated period label from periodLabel(t, period). Pass this for locale-aware labels. */
    label?: string
    /** date-fns Locale for locale-aware month names (FR-08). Defaults to enUS if not provided. */
    dateLocale?: DateFnsLocale
  },
): string {
  const label = options?.label ?? period
  if (!range.start || !range.end) return label
  const fmtOpts = options?.dateLocale ? { locale: options.dateLocale } : {}
  return `${label} (${format(range.start, "MMM d, yyyy", fmtOpts)} – ${format(range.end, "MMM d, yyyy", fmtOpts)})`
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
