# Fundout — Brand Guide

This is the single source of truth for Fundout's visual identity. If you're building anything user-facing (UI, social posts, decks, emails), start here.

---

## 1. Manifesto

> **It's not your trading. It's just math.**

This is the thesis. Every piece of communication should reinforce it.

**What it means:** prop firm outcomes are dominated by structure (cost, drawdown, payout rules, variance), not by trading skill alone. Most traders are losing a math problem, not a trading problem.

**What it isn't:**
- A motivational slogan.
- A promise of profits.
- An attack on trading discipline.

**Use it:**
- As tagline below the wordmark.
- As headline in marketing surfaces.
- Short version: *"It's just math."* (for sidebars, tabs, tight spaces).

---

## 2. Audience

Prop-firm traders who have already tried — a lot or a little — and feel that *something doesn't add up* in funded accounts, even when their trading isn't bad.

They can be:
- Advanced traders bleeding fees across attempts.
- Beginners trying funded accounts as their first serious capital.

What unites them: a suspicion that the propfirm game has rules they haven't been told.

---

## 3. Tone of voice

Think **senior analyst who's already been through it**, not coach, not guru.

| Do | Don't |
|---|---|
| Be direct, almost clinical | Be hype-y or motivational |
| Show numbers, then conclusions | Promise outcomes |
| Acknowledge frustration | Pretend you have the magic answer |
| Use plain English | Use trader jargon to sound smart |
| Speak in second person ("you") | Speak in royal "we" |

**Sample phrasings that fit:**
- *"Review your strategy — it performs worse than random."*
- *"You'll burn $X in fees before you see your first payout."*
- *"This is the math. Decide if you want to play."*

---

## 4. Logo

The mark is a **bell-curve distribution** with **percentile brackets** — a symbol that *is* mathematics, rather than representing it.

### Variants

| File | When to use |
|---|---|
| `logo/fundout-symbol.svg` | Avatars, watermarks, isolated brand marks |
| `logo/fundout-horizontal.svg` | App headers, email signatures, navigation |
| `logo/fundout-vertical.svg` | Hero sections, presentation covers, landing pages |
| `logo/fundout-favicon.svg` | Browser tabs only — simplified variant |

Each `.svg` has a matching `@2x.png` for raster-required contexts (social media, slides, print).

### Live component

Inside the app, use `<BrandMark />` from `src/components/common/brand-mark.tsx`. It handles size, optional tagline, and sidebar collapse state.

The shared inline SVG is exported as `<FundoutSymbol />` for decorative uses (e.g. watermarks).

### Favicon is a separate variant

The full mark has too many fine details (brackets, tick marks) to read at 16px. The favicon drops the vertical brackets, keeps only the curve with horizontal feet, and ships as a teal-on-dark rounded tile. **This intentional divergence is correct** — distinct variants per context is how mature brand systems work.

### Don'ts

- Don't recolor the symbol outside the palette.
- Don't add effects: shadows, gradients, glows, outlines.
- Don't rotate or distort the wordmark.
- Don't place it on busy backgrounds without enough negative space (see Clear space below).
- Don't recreate the symbol in another tool — always use the SVGs from this folder.

### Clear space

Reserve a margin equal to the height of the wordmark's "F" on all sides. No other element should enter that area.

---

## 5. Color

Tokens come from `src/index.css`. Always reference them through Tailwind utilities (`text-primary`, `bg-background`, etc.) rather than hard-coded HEX.

### Brand

| Role | Light | Dark | Notes |
|---|---|---|---|
| Primary (teal) | `#14B8A6` | `#27CFCE` | Used for accents, primary actions, the symbol |
| Background | `#FAFAFA` | `#0A0A0A` | App canvas |
| Surface | `#FFFFFF` | `#171718` | Cards, dialogs |
| Foreground | `#171718` | `#FAFAFA` | Body text |
| Muted foreground | `#71717A` | `#A1A1AA` | Captions, secondary text |

### Semantic

Use these only for state — never for decoration.

| State | Color | Used for |
|---|---|---|
| Positive | `emerald-500` / `emerald-400` | Wins, gains, success |
| Negative | `pink-500` / `rose-400` | Losses, breached accounts |
| Warning | `amber-500` / `amber-400` | Risk warnings, caution |

---

## 6. Typography

One family, used consistently across the whole product and marketing.

**Manrope** — geometric sans with humanist details. Technical enough to feel rigorous, warm enough to feel approachable. That balance matches the tone of voice.

### Scale

| Use | Weight | Notes |
|---|---|---|
| Display / hero headlines | 700 (Bold) | `text-3xl` to `text-5xl` |
| Section titles | 600 (Semibold) | `text-xl` to `text-2xl` |
| Wordmark | 600 (Semibold) | Same family — no separate logo font |
| Body | 400–500 (Regular / Medium) | `text-sm` to `text-base` |
| Tagline / caption | 500 (Medium) | `text-xs` to `text-sm`, `muted-foreground` |

### Editorial detail

In the tagline *"It's not your trading. It's just math."*, the words **trading** and **math** are set in bold. That contrast is the manifesto. Preserve it wherever the tagline appears in two-or-more lines.

---

## 7. File structure

```
brand/
├── README.md                                ← this file
└── logo/
    ├── fundout-symbol.svg                   ← isolated mark
    ├── fundout-symbol@2x.png
    ├── fundout-horizontal.svg               ← lockup horizontal
    ├── fundout-horizontal@2x.png
    ├── fundout-vertical.svg                 ← hero lockup
    ├── fundout-vertical@2x.png
    ├── fundout-favicon.svg                  ← reference of the full-detail favicon
    ├── fundout-favicon@2x.png
    └── fundout-favicon-simplified@2x.png    ← the shipped 16px-optimized variant
```

The favicon actually served at `public/favicon.svg` is the simplified variant. Use `?v=N` query strings to bust browser cache when updating it.

---

## 8. Quick reference

- **Tagline (full)**: It's not your trading. It's just math.
- **Tagline (short)**: It's just math.
- **Primary teal (dark mode)**: `#27CFCE`
- **Primary teal (light mode)**: `#14B8A6`
- **Background (dark)**: `#0A0A0A`
- **Font**: Manrope
- **Component**: `<BrandMark size="sm|md|lg" tagline />`
