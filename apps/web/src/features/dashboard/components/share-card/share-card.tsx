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
  attempts: string
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
    | "netPnl"
    | "totalSpent"
    | "totalPayoutsNet"
    | "fundingRatio"
    | "payoutRatio"
    | "totalAttempts"
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

/**
 * Measures rendered text width via an offscreen canvas, using the SAME font
 * shorthand the DOM node uses. Reused canvas to avoid per-call allocation.
 * Returns 0 when unavailable (SSR / no 2D context) so callers can fall back.
 */
let measureCanvas: HTMLCanvasElement | null = null
function measureTextWidth(text: string, font: string): number {
  if (typeof document === "undefined") return 0
  measureCanvas ??= document.createElement("canvas")
  const ctx = measureCanvas.getContext("2d")
  if (!ctx) return 0
  ctx.font = font
  return ctx.measureText(text).width
}

/**
 * Fixed-canvas fit: the hero PnL and the ROI badge are both nowrap + flexShrink:0,
 * so a large PnL would push the badge past the card edge (clipped by overflow:hidden).
 * The whole hero row (gap, badge font, badge padding) scales linearly with heroFont,
 * so we measure the row at the base size and shrink heroFont just enough to fit.
 */
function fitHeroFont(params: {
  heroText: string
  badgeText: string
  baseHeroFont: number
  availableWidth: number
}): number {
  const { heroText, badgeText, baseHeroFont, availableWidth } = params
  const gap = baseHeroFont * 0.16
  const badgeFont = baseHeroFont * 0.2
  const badgePadX = baseHeroFont * 0.14
  const heroWidth = measureTextWidth(
    heroText,
    `800 ${baseHeroFont}px ${SHARE_CARD_FONT_STACK.heading}`,
  )
  if (heroWidth === 0) return baseHeroFont // measurement unavailable — keep base
  const badgeWidth = measureTextWidth(
    badgeText,
    `600 ${badgeFont}px ${SHARE_CARD_FONT_STACK.heading}`,
  )
  const rowWidth = heroWidth + gap + badgeWidth + badgePadX * 2 + 4 // +4 = badge border
  if (rowWidth <= availableWidth) return baseHeroFont
  return Math.floor(baseHeroFont * (availableWidth / rowWidth))
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

    const heroText = formatSignedCurrency(kpis.netPnl)
    const heroFont = fitHeroFont({
      heroText,
      badgeText: `${roiDisplay} ${kpiLabels.roi}`,
      baseHeroFont: s.heroFont,
      availableWidth: width - s.padding * 2,
    })

    const secondaryMetrics = [
      { label: kpiLabels.attempts,     value: String(kpis.totalAttempts) },
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
        {/* Dot pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(${SHARE_CARD_THEME.fg} 1.5px, transparent 1.5px)`,
            backgroundSize: "32px 32px",
            opacity: 0.07,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Watermark — FundoutSymbol large, rotated, bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: s.watermarkBottom,
            right: s.watermarkRight,
            width: s.watermarkSize,
            height: s.watermarkSize,
            opacity: 0.10,
            transform: "rotate(-12deg)",
            color: SHARE_CARD_THEME.accent,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <FundoutSymbol />
        </div>

        {/* All foreground content sits above dot pattern + watermark */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: dimensions === "ig" ? "center" : undefined,
          }}
        >
          {/* Header row: logo + period badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: s.sectionGap,
            }}
          >
            {/* Logo: symbol + wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: s.brandSymbolSize,
                  height: s.brandSymbolSize,
                  color: SHARE_CARD_THEME.accent,
                  flexShrink: 0,
                  alignContent: "center"

                }}
              >
                <FundoutSymbol />
              </div>
              <span
                style={{
                  fontFamily: SHARE_CARD_FONT_STACK.heading,
                  fontSize: s.brandFont,
                  fontWeight: 500,
                  color: SHARE_CARD_THEME.fg,
                  lineHeight: 1,
                  letterSpacing: 1,
                }}
              >
                Fundout
              </span>
            </div>

            {/* Period badge pill */}
            <span
              style={{
                fontSize: s.badgeFont,
                color: SHARE_CARD_THEME.fgMuted,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                padding: "8px 20px",
                border: `2px solid ${SHARE_CARD_THEME.divider}`,
                borderRadius: 999,
                fontWeight: 600,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {periodLabel.toUpperCase()}
            </span>
          </div>

          {/* Hero block: Net PnL on the left, ROI as a badge on the top-right */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: Math.round(heroFont * 0.16),
              marginBottom: s.sectionGap * 0.5,
            }}
          >
            <span
              style={{
                fontSize: heroFont,
                fontFamily: SHARE_CARD_FONT_STACK.heading,
                fontWeight: 800,
                color: pnlColor,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {formatSignedCurrency(kpis.netPnl)}
            </span>

            {/* ROI — top-right badge pill */}
            <span
              style={{
                fontSize: Math.round(heroFont * 0.20),
                fontFamily: SHARE_CARD_FONT_STACK.heading,
                fontWeight: 600,
                color: SHARE_CARD_THEME.accent,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                flexShrink: 0,
                padding: `${Math.round(heroFont * 0.08)}px ${Math.round(heroFont * 0.14)}px`,
                border: `2px solid ${SHARE_CARD_THEME.accent}`,
                borderRadius: 999,
              }}
            >
              {roiDisplay} {kpiLabels.roi}
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: SHARE_CARD_THEME.divider,
              marginBottom: s.sectionGap,
            }}
          />

          {/* Secondary metrics grid — 5 cols for X (landscape), 3+2 stagger for IG (square) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: dimensions === "ig" ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
              columnGap: s.gridGap,
              rowGap: dimensions === "ig" ? s.sectionGap : s.gridGap,
              marginBottom: dimensions === "ig" ? undefined : "auto",
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
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
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

          {/* Footer row: tagline + handle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: s.sectionGap,
            }}
          >
            <span
              style={{
                fontSize: s.footerFont,
                color: SHARE_CARD_THEME.fgMuted,
                fontWeight: 400,
              }}
            >
              {kpiLabels.tagline}
            </span>

            {handle.trim() !== "" && (
              <span
                style={{
                  fontSize: s.footerFont,
                  color: SHARE_CARD_THEME.accent,
                  fontWeight: 600,
                }}
              >
                @{handle.replace(/^@/, "").trim()}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  },
)

ShareCard.displayName = "ShareCard"
