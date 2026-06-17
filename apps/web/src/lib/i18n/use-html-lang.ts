import { useEffect } from "react"
import { useTranslation } from "react-i18next"

/**
 * Syncs the <html lang> attribute to the active i18next language.
 * FR-11: document.documentElement.lang must reflect the active language
 * at all times, updated synchronously on every languageChanged event.
 * NFR-03: a11y — lang attribute must match BCP-47 codes "es" or "en".
 */
export function useHtmlLang(): void {
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18n.language
  }, [i18n.language])
}
