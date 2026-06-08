/**
 * i18next initialization — synchronous module-eval init.
 * Import this file for its side-effect BEFORE ReactDOM.createRoot(...).render().
 * Ensures strings are available on first React render (NFR-02: no FOUC).
 */
import i18next from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import { resources } from "@/lib/i18n/resources"
import { warnMissingKey } from "@/lib/i18n/missing-key-handler"

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "es"],
    defaultNS: "common",
    ns: [
      "common",
      "auth",
      "dashboard",
      "evaluations",
      "funded",
      "payouts",
      "backtest",
      "calculator",
      "bankroll-mc",
    ],
    interpolation: {
      // React already escapes values — no double-escaping needed
      escapeValue: false,
    },
    returnNull: false,
    returnEmptyString: false,
    detection: {
      // FR-01: localStorage first, then browser language
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "fundout.locale",
    },
    // FR-10: missing key handling
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: import.meta.env.DEV ? warnMissingKey : undefined,
  })

export default i18next
export { i18next as i18n }
