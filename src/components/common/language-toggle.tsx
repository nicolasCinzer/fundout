import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSetLocale } from "@/features/user/api/profile-queries"
import type { Locale } from "@/features/user/api/profile-queries"

const LOCALE_META: Record<Locale, { flag: string; short: string }> = {
  es: { flag: "🇪🇸", short: "ESP" },
  en: { flag: "🇺🇸", short: "EN" },
}

/**
 * Language switcher component.
 * Auth-agnostic: useSetLocale internally skips the Supabase write when no
 * authenticated userId exists (login page path — FR-04).
 * When authenticated: persists locale to profiles.locale (FR-03).
 * Re-render is immediate (optimistic); Supabase write is fire-and-forget.
 */
export function LanguageToggle() {
  const { t, i18n } = useTranslation("common")
  const { mutate: setLocale } = useSetLocale()

  const active = (i18n.language.split("-")[0] as Locale) in LOCALE_META
    ? (i18n.language.split("-")[0] as Locale)
    : "en"
  const current = LOCALE_META[active]

  const handleChange = (value: string) => {
    setLocale(value as Locale)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2 font-medium">
          <span aria-hidden="true" className="text-base leading-none">
            {current.flag}
          </span>
          <span className="text-xs tracking-wide">{current.short}</span>
          <span className="sr-only">{t("language.toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={active}
          onValueChange={handleChange}
        >
          <DropdownMenuRadioItem value="es">
            <span aria-hidden="true" className="mr-2">
              {LOCALE_META.es.flag}
            </span>
            {t("language.es")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">
            <span aria-hidden="true" className="mr-2">
              {LOCALE_META.en.flag}
            </span>
            {t("language.en")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
