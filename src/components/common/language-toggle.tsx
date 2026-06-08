import { Globe } from "lucide-react"
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

  const handleChange = (value: string) => {
    setLocale(value as Locale)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("language.toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={i18n.language}
          onValueChange={handleChange}
        >
          <DropdownMenuRadioItem value="es">
            {t("language.es")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">
            {t("language.en")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
