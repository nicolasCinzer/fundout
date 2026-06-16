import { forwardRef } from "react"
import { FundoutSymbol } from "@/components/common/brand-mark"
import {
  SHARE_CARD_THEME,
  SHARE_CARD_DIMENSIONS,
  SHARE_CARD_FONT_STACK,
  SIZING,
  type ShareCardDimensionKey,
} from "@/features/dashboard/components/share-card/share-card.constants"
import type { DashboardKpis } from "@/features/dashboard/lib/compute-kpis"
import { formatCurrency } from "@/lib/format"

export type ShareCardKpiLabels = {
  netPnl: string
  roi: string
  totalSpent: string
  totalPayouts: string
  fundingRatio: string
  payoutRatio: string
  emptyValue: string
  tagline: string
}

export type ShareCardProps = {
  kpis: Pick<
    DashboardKpis,
    "netPnl" | "totalSpent" | "totalPayoutsNet" | "fundingRatio" | "payoutRatio"
  > & { roi: number | null }
  periodLabel: string
  handle: string
  dimensions: ShareCardDimensionKey
  kpiLabels: ShareCardKpiLabels
}

function formatSignedCurrency(value: number): string {
  const formatted = formatCurrency(Math.abs(value))
  if (value > 0) return `+${formatted}`
  if (value < 0) return `−${formatted}` // U+2212 minus sign
  return formatted
}

function formatSignedPercent(value: number, decimals = 1): string {
  const abs = Math.abs(value) * 100
  const fixed = abs.toFixed(decimals)
  if (value > 0) return `+${fixed}%`
  if (value < 0) return `−${fixed}%`
  return `${fixed}%`
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ kpis, periodLabel, handle, dimensions, kpiLabels }, ref) => {
    const { width, height } = SHARE_CARD_DIMENSIONS[dimensions]
    const s = SIZING[dimensions]

    const pnlColor =
      kpis.netPnl > 0
        ? SHARE_CARD_THEME.positive
        : kpis.netPnl < 0
          ? SHARE_CARD_THEME.negative
          : SHARE_CARD_THEME.fg

    const roiDisplay =
      kpis.roi == null
        ? kpiLabels.emptyValue
        : formatSignedPercent(kpis.roi)

    const secondaryMetrics = [
      { label: kpiLabels.totalSpent,   value: formatCurrency(kpis.totalSpent) },
      { label: kpiLabels.totalPayouts, value: formatCurrency(kpis.totalPayoutsNet) },
      { label: kpiLabels.fundingRatio, value: formatPercent(kpis.fundingRatio) },
      { label: kpiLabels.payoutRatio,  value: formatPercent(kpis.payoutRatio) },
    ]

    return (
      <div
        ref={ref}
        style={{
          width,
          height,
          background: SHARE_CARD_THEME.bg,
          fontFamily: SHARE_CARD_FONT_STACK.body,
          color: SHARE_CARD_THEME.fg,
          display: "flex",
          flexDirection: "column",
          padding: s.padding,
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header: brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: s.sectionGap,
          }}
        >
          <div style={{ width: s.brandSymbolSize, height: s.brandSymbolSize, color: SHARE_CARD_THEME.accent, flexShrink: 0 }}>
            <FundoutSymbol />
          </div>
          <span
            style={{
              fontFamily: SHARE_CARD_FONT_STACK.heading,
              fontSize: s.brandFont,
              fontWeight: 700,
              color: SHARE_CARD_THEME.fg,
              lineHeight: 1,
            }}
          >
            Fundout
          </span>
        </div>

        {/* Hero: Net PnL */}
        <div style={{ marginBottom: s.sectionGap * 0.5 }}>
          <div
            style={{
              fontSize: s.heroFont,
              fontFamily: SHARE_CARD_FONT_STACK.heading,
              fontWeight: 800,
              color: pnlColor,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {formatSignedCurrency(kpis.netPnl)}
          </div>

          {/* ROI accent line */}
          <div
            style={{
              fontSize: s.roiFont,
              fontWeight: 600,
              color: SHARE_CARD_THEME.accent,
              marginTop: 12,
              lineHeight: 1,
            }}
          >
            {kpiLabels.roi} &middot; {roiDisplay}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: SHARE_CARD_THEME.divider,
            marginBottom: s.sectionGap,
          }}
        />

        {/* Secondary metrics grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: s.gridGap,
            marginBottom: "auto",
          }}
        >
          {secondaryMetrics.map((m) => (
            <div key={m.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: s.secondaryLabelFont,
                  color: SHARE_CARD_THEME.fgMuted,
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {m.label}
              </span>
              <span
                style={{
                  fontSize: s.secondaryValueFont,
                  fontFamily: SHARE_CARD_FONT_STACK.heading,
                  fontWeight: 700,
                  color: SHARE_CARD_THEME.fg,
                  lineHeight: 1,
                }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: s.sectionGap,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: s.footerFont,
                color: SHARE_CARD_THEME.fgMuted,
                fontWeight: 500,
              }}
            >
              {periodLabel}
            </span>
            <span
              style={{
                fontSize: s.footerFont * 0.75,
                color: SHARE_CARD_THEME.fgMuted,
                fontWeight: 400,
              }}
            >
              {kpiLabels.tagline}
            </span>
          </div>

          {handle.trim() !== "" && (
            <span
              style={{
                fontSize: s.footerFont,
                color: SHARE_CARD_THEME.accent,
                fontWeight: 600,
              }}
            >
              {handle.trim()}
            </span>
          )}
        </div>
      </div>
    )
  },
)

ShareCard.displayName = "ShareCard"
