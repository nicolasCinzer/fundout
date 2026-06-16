/**
 * Share Card — hardcoded constants.
 * ALL colors are hardcoded hex. No Tailwind tokens, no CSS vars, no OKLCH.
 * ADR-1: Canvas rasterization is inconsistent with oklch(); hex is universally safe.
 */

export const SHARE_CARD_THEME = {
  bg:       "#0A0E1A",
  surface:  "#141A2B",
  fg:       "#F5F7FA",
  fgMuted:  "#8B95A7",
  accent:   "#14B8A6",
  positive: "#22C55E",
  negative: "#EF4444",
  divider:  "#1F2A40",
} as const

export const SHARE_CARD_DIMENSIONS = {
  x:  { width: 1200, height: 630,  label: "1200 × 630 (X)" },
  ig: { width: 1080, height: 1080, label: "1080 × 1080 (IG)" },
} as const

export type ShareCardDimensionKey = keyof typeof SHARE_CARD_DIMENSIONS

export const SHARE_HANDLE_STORAGE_KEY = "fundout.shareCard.handle"

export const SHARE_CARD_FONT_STACK = {
  body:    "'Manrope Variable', system-ui, sans-serif",
  heading: "'Outfit Variable', system-ui, sans-serif",
} as const

/**
 * Per-dimension sizing config — drives all font sizes and padding inside ShareCard.
 * ADR-6: Single component with sizing config, not two parallel components.
 */
export const SIZING = {
  x: {
    padding:             64,
    heroFont:            140,
    roiFont:             36,
    secondaryValueFont:  48,
    secondaryLabelFont:  22,
    brandFont:           36,
    brandSymbolSize:     48,
    footerFont:          24,
    gridGap:             16,
    sectionGap:          40,
  },
  ig: {
    padding:             80,
    heroFont:            160,
    roiFont:             40,
    secondaryValueFont:  56,
    secondaryLabelFont:  26,
    brandFont:           40,
    brandSymbolSize:     56,
    footerFont:          28,
    gridGap:             20,
    sectionGap:          48,
  },
} as const
