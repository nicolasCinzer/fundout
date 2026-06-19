/**
 * Share Card — hardcoded constants.
 * ALL colors are hardcoded hex. No Tailwind tokens, no CSS vars, no OKLCH.
 * ADR-1: Canvas rasterization is inconsistent with oklch(); hex is universally safe.
 */

export const SHARE_CARD_THEME = {
  bg:       "#0a0a0a",  // brand near-black
  surface:  "#171718",  // brand surface
  fg:       "#fafafa",  // brand foreground
  fgMuted:  "#71717a",  // brand muted
  accent:   "#27cfce",  // BRAND teal — primary accent
  positive: "#27cfce",  // brand teal — positive PnL flexes on-brand
  negative: "#ff5b5b",  // warm red, brand-friendly
  divider:  "#27272a",  // brand border
} as const

export const SHARE_CARD_DIMENSIONS = {
  x:  { width: 1200, height: 630,  label: "1200 × 630 (X)" },
  ig: { width: 1080, height: 1350, label: "1080 × 1350 (IG)" },
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
    brandFont:           32,
    brandSymbolSize:     56,
    badgeFont:           18,
    footerFont:          24,
    gridGap:             16,
    sectionGap:          40,
    watermarkSize:       500,
    watermarkBottom:     -90,
    watermarkRight:      -90,
  },
  ig: {
    padding:             96,   // was 80 — more breathing room, pushes footer down
    heroFont:            160,  // was 160 — more presence in square format
    roiFont:             52,   // for reference; inline ROI uses Math.round(heroFont * 0.32)
    secondaryValueFont:  64,   // was 56
    secondaryLabelFont:  28,   // was 26
    brandFont:           44,   // was 40
    brandSymbolSize:     60,   // was 72 (intentionally reduced — less crowded header)
    badgeFont:           20,
    footerFont:          30,   // was 28
    gridGap:             64,   // wider gap for 2-col layout
    sectionGap:          72,   // was 48
    watermarkSize:       960,  // was 640 — fills more visual space
    watermarkBottom:     -160,
    watermarkRight:      -160,
  },
} as const
