import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { enUS as enUSLocale, es as esLocale } from "date-fns/locale"
import { formatCurrency, formatNumber, formatDate } from "@/lib/format"

/**
 * Returns memoized formatter functions bound to the active i18next locale.
 * ADR-7: pure factory functions in format.ts for non-component callers;
 * this hook provides zero-ceremony component ergonomics.
 *
 * ADR-4: formatters.currency always uses en-US grouping (not locale-aware).
 * ADR-6: formatters.dateLocale is fully locale-aware (date-fns Locale object).
 */
export function useFormatters() {
  const { i18n } = useTranslation()
  const locale = i18n.language

  return useMemo(
    () => ({
      /** Format a USD currency value. Always en-US digit grouping (ADR-4). */
      currency: (v: number) => formatCurrency(v),

      /** Format a number with locale-aware digit separators. */
      number: (v: number, opts?: Intl.NumberFormatOptions) =>
        formatNumber(v, locale, opts),

      /** Format a date with locale-aware month names. */
      date: (v: Date | string, opts?: Intl.DateTimeFormatOptions) =>
        formatDate(v, locale, opts),

      /**
       * date-fns Locale object for the active language.
       * Pass to date-fns functions that accept a locale (format, formatDistance, etc).
       * ADR-6: dates are fully locale-aware.
       */
      dateLocale: locale === "es" ? esLocale : enUSLocale,
    }),
    [locale],
  )
}
