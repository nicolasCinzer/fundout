import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useSyncLocale } from "@/lib/i18n/use-sync-locale"
import { useHtmlLang } from "@/lib/i18n/use-html-lang"
import { useProfile, useSetLocale } from "@/features/user/api/profile-queries"
import { useAuth } from "@/features/auth/api/auth-provider"

/**
 * Mounts i18n sync effects inside the authenticated tree.
 * - useSyncLocale: profile.locale → i18n (FR-02, S-04)
 * - useHtmlLang: i18n.language → <html lang> (FR-11)
 * - Cold-start upsert: when userId exists but no profile row, insert with
 *   the currently-active language (FR-06, S-03). A guard ref prevents
 *   double-fire in StrictMode (S-11).
 *
 * NFR-04: must be mounted inside <AuthProvider>, before any routed page renders.
 */
export function I18nLocaleSync(): null {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const { data: profile, isSuccess } = useProfile()
  const { mutate: setLocale } = useSetLocale()
  const coldStartFiredRef = useRef(false)

  // Sync profile.locale → i18n (profile is authoritative)
  useSyncLocale()

  // Sync i18n.language → <html lang>
  useHtmlLang()

  // Cold-start upsert: create profile row when none exists (FR-06, S-03)
  useEffect(() => {
    if (!user?.id) return
    if (!isSuccess) return // wait for query to resolve
    if (profile !== null) return // row already exists
    if (coldStartFiredRef.current) return // prevent StrictMode double-fire

    coldStartFiredRef.current = true
    // Use the currently active language (detected from localStorage/navigator)
    setLocale(i18n.language as "en" | "es")
  }, [user?.id, isSuccess, profile, i18n.language, setLocale])

  return null
}
