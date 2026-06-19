"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleSwitch() {
    const nextLocale = locale === "en" ? "es" : "en";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(pathname as any, { locale: nextLocale });
  }

  return (
    <button
      onClick={handleSwitch}
      className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      aria-label={locale === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
    >
      {locale === "en" ? "ES" : "EN"}
    </button>
  );
}
