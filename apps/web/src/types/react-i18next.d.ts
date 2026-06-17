/**
 * react-i18next module augmentation.
 * Links CustomTypeOptions to the literal types derived from the EN locale JSONs.
 * This gives TypeScript autocomplete + compile-time errors on missing keys.
 */
import "react-i18next"
import type common from "@/locales/en/common.json"
import type auth from "@/locales/en/auth.json"
import type dashboard from "@/locales/en/dashboard.json"
import type evaluations from "@/locales/en/evaluations.json"
import type funded from "@/locales/en/funded.json"
import type payouts from "@/locales/en/payouts.json"
import type backtest from "@/locales/en/backtest.json"
import type calculator from "@/locales/en/calculator.json"
import type bankrollMc from "@/locales/en/bankroll-mc.json"
import type settings from "@/locales/en/settings.json"

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: {
      common: typeof common
      auth: typeof auth
      dashboard: typeof dashboard
      evaluations: typeof evaluations
      funded: typeof funded
      payouts: typeof payouts
      backtest: typeof backtest
      calculator: typeof calculator
      "bankroll-mc": typeof bankrollMc
      settings: typeof settings
    }
  }
}
