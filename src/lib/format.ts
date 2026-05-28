const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const currencyFormatterPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
})

export function formatCurrency(value: number, precise = false): string {
  return precise
    ? currencyFormatterPrecise.format(value)
    : currencyFormatter.format(value)
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value)
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatDate(value: string | Date): string {
  if (typeof value === "string") {
    const m = DATE_ONLY_RE.exec(value)
    if (m) {
      return dateFormatter.format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
    }
    return dateFormatter.format(new Date(value))
  }
  return dateFormatter.format(value)
}
