import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useProfile } from "@/features/user/api/profile-queries"

/**
 * Effect hook: syncs profile.locale → i18n + localStorage.
 * Profile is authoritative over client-side storage (FR-02, S-04).
 *
 * When profile.locale differs from the currently active i18n language,
 * this hook calls i18n.changeLanguage and mirrors the value to localStorage
 * so post-logout unauthenticated visits pick up the last-used locale (FR-12).
 *
 * Mount this inside <I18nLocaleSync> which lives under <AuthProvider>.
 */
export function useSyncLocale(): void {
  const { i18n } = useTranslation()
  const { data: profile } = useProfile()

  useEffect(() => {
    if (!profile?.locale) return
    if (profile.locale === i18n.language) return

    // Profile wins — override current language (FR-02, S-04)
    i18n.changeLanguage(profile.locale)
    // Mirror to localStorage so logout → login without re-fetch still picks
    // up the correct locale from the detector (FR-12)
    localStorage.setItem("fundout.locale", profile.locale)
  }, [profile?.locale, i18n])
}
