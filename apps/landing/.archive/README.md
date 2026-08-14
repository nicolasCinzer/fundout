# Archived landing pieces

Code parked here is intentionally out of the build (excluded in `tsconfig.json`,
and `.`-prefixed so Next ignores it for routing). Kept for future reuse.

## pricing (archived 2026-07-13)

Pricing is disabled while Fundout is free. To restore:

- `pricing.tsx` → `components/pricing.tsx`, then re-add `<Pricing />` in
  `app/[locale]/page.tsx` and the `#pricing` nav item in `components/header.tsx`.
- `marketing-pricing-route/page.tsx` → `app/[locale]/(marketing)/pricing/page.tsx`.
- Re-add the `Pricing` footer link in `components/footer.tsx`.

The `pricing.*` i18n keys were left in `packages/i18n-marketing/locales/*/marketing.json`.
