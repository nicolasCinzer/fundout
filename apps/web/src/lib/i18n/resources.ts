import enCommon from "@/locales/en/common.json"
import enAuth from "@/locales/en/auth.json"
import enDashboard from "@/locales/en/dashboard.json"
import enEvaluations from "@/locales/en/evaluations.json"
import enFunded from "@/locales/en/funded.json"
import enPayouts from "@/locales/en/payouts.json"
import enBacktest from "@/locales/en/backtest.json"
import enCalculator from "@/locales/en/calculator.json"
import enBankrollMc from "@/locales/en/bankroll-mc.json"
import enSettings from "@/locales/en/settings.json"

import esCommon from "@/locales/es/common.json"
import esAuth from "@/locales/es/auth.json"
import esDashboard from "@/locales/es/dashboard.json"
import esEvaluations from "@/locales/es/evaluations.json"
import esFunded from "@/locales/es/funded.json"
import esPayouts from "@/locales/es/payouts.json"
import esBacktest from "@/locales/es/backtest.json"
import esCalculator from "@/locales/es/calculator.json"
import esBankrollMc from "@/locales/es/bankroll-mc.json"
import esSettings from "@/locales/es/settings.json"

/**
 * Typed resource map aggregating all namespace JSONs for both supported locales.
 * Used by i18next.init() in src/lib/i18n/index.ts.
 * Key convention: dot.notation.lowerCamel keys inside each JSON.
 */
export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    evaluations: enEvaluations,
    funded: enFunded,
    payouts: enPayouts,
    backtest: enBacktest,
    calculator: enCalculator,
    "bankroll-mc": enBankrollMc,
    settings: enSettings,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    dashboard: esDashboard,
    evaluations: esEvaluations,
    funded: esFunded,
    payouts: esPayouts,
    backtest: esBacktest,
    calculator: esCalculator,
    "bankroll-mc": esBankrollMc,
    settings: esSettings,
  },
} as const

export type Resources = typeof resources
