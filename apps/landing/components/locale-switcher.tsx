"use client";

import { useLocale } from "next-intl";
import { Button } from "@fundout/ui/button";
import { useRouter, usePathname } from "@/i18n/navigation";

// Mirrors the app's LanguageToggle (apps/web · language-toggle.tsx).
const LOCALE_META = {
  es: { flag: "🇪🇸", short: "ESP" },
  en: { flag: "🇺🇸", short: "EN" },
} as const;

export function LocaleSwitcher() {
  const locale = useLocale() as "en" | "es";
  const router = useRouter();
  const pathname = usePathname();

  const current = LOCALE_META[locale] ?? LOCALE_META.en;

  function handleSwitch() {
    const nextLocale = locale === "en" ? "es" : "en";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(pathname as any, { locale: nextLocale });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSwitch}
      className="gap-1.5 px-2 font-medium"
      aria-label={locale === "en" ? "Cambiar a español" : "Switch to English"}
    >
      <span aria-hidden="true" className="text-base leading-none">
        {current.flag}
      </span>
      <span className="text-xs tracking-wide">{current.short}</span>
    </Button>
  );
}
