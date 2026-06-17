import { describe, it, expect } from "vitest"
import {
  formatCurrency,
  formatNumber,
  formatDate,
  CURRENCY_LOCALE,
} from "@/lib/format"

describe("CURRENCY_LOCALE", () => {
  it("is always en-US (ADR-4: digit grouping stays en-US even in ES locale)", () => {
    expect(CURRENCY_LOCALE).toBe("en-US")
  })
})

describe("formatCurrency", () => {
  it("formats 1000 as $1,000.00 regardless of locale (ADR-4)", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00")
  })

  it("formats 1000 when locale 'es-ES' is passed — still uses en-US grouping", () => {
    expect(formatCurrency(1000, "es-ES")).toBe("$1,000.00")
  })

  it("formats 1234.56 with 2 decimal places", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56")
  })

  it("formats negative values", () => {
    expect(formatCurrency(-500)).toBe("-$500.00")
  })
})

describe("formatNumber", () => {
  it("formats 1234.56 with en-US locale → comma grouping", () => {
    expect(formatNumber(1234.56, "en-US")).toBe("1,234.56")
  })

  it("formats 1234.56 with es-ES locale → comma decimal separator", () => {
    // Node test env may ship partial ICU (no thousands separator in es-ES),
    // but the decimal separator must be a comma in Spanish locales.
    const result = formatNumber(1234.56, "es-ES")
    expect(result).toMatch(/,56$/)
  })

  it("accepts optional Intl.NumberFormatOptions", () => {
    const result = formatNumber(0.75, "en-US", {
      style: "percent",
      maximumFractionDigits: 0,
    })
    expect(result).toBe("75%")
  })
})

describe("formatDate", () => {
  it("formats a date string with en-US locale", () => {
    const result = formatDate("2024-01-15", "en-US")
    expect(result).toBe("Jan 15, 2024")
  })

  it("formats a date string with es locale (abbreviated month in Spanish)", () => {
    const result = formatDate("2024-01-15", "es")
    // Should render Spanish abbreviated month name
    expect(result).toMatch(/ene/i)
  })

  it("formats a Date object", () => {
    const d = new Date(2024, 0, 15) // Jan 15 2024 local time
    const result = formatDate(d, "en-US")
    expect(result).toBe("Jan 15, 2024")
  })

  it("handles ISO date-only strings (YYYY-MM-DD) without timezone shift", () => {
    // Date-only strings parsed as local date should give correct day
    const result = formatDate("2024-03-05", "en-US")
    expect(result).toBe("Mar 5, 2024")
  })
})
