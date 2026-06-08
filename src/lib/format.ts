/**
 * Pure locale-aware formatting factories.
 * No module-level Intl singletons — callers supply locale to get locale-specific output.
 *
 * ADR-4: Currency digit grouping always uses en-US regardless of the active locale.
 * Rationale: financial product where users compare USD values across propfirms;
 * mixed conventions ($1.234,56 vs $1,234.56) cause comparison errors in the domain.
 */

/** ADR-4: Currency formatting always uses this locale for digit grouping. */
export const CURRENCY_LOCALE = "en-US"

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Format a currency value.
 * Always uses en-US digit grouping (ADR-4). The `_locale` parameter is
 * accepted for call-site consistency but is intentionally ignored.
 */
export function formatCurrency(value: number, _locale?: string): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a percentage value.
 * Always uses en-US locale (percentages have no meaningful locale variation
 * for this use case: propfirm statistics).
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Format a number with locale-aware digit grouping.
 * Pass the active i18n locale to get locale-correct separators.
 */
export function formatNumber(
  value: number,
  locale: string,
  opts?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, opts).format(value)
}

/**
 * Format a date value with locale-aware month names.
 * Handles ISO date-only strings (YYYY-MM-DD) without UTC timezone shift.
 */
export function formatDate(
  value: Date | string,
  locale: string,
  opts?: Intl.DateTimeFormatOptions,
): string {
  let d: Date
  if (typeof value === "string") {
    const m = DATE_ONLY_RE.exec(value)
    if (m) {
      // Construct as local date to avoid UTC midnight → previous day in negative-offset zones
      d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    } else {
      d = new Date(value)
    }
  } else {
    d = value
  }

  return new Intl.DateTimeFormat(
    locale,
    opts ?? { year: "numeric", month: "short", day: "numeric" },
  ).format(d)
}
