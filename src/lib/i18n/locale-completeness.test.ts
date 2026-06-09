/**
 * Locale completeness tests (Task 5.1 / 5.2).
 *
 * Verifies that the Spanish locale JSON files have all the same keys as
 * their English counterparts. Missing keys in es/ would cause the UI to
 * render raw i18next key strings (e.g. "theme.toggle") instead of text.
 *
 * Strategy: recursively collect leaf paths from EN, assert every leaf path
 * exists in ES. Runs in node env — no DOM required.
 */

import { describe, it, expect } from "vitest"
import enCommon from "@/locales/en/common.json"
import esCommon from "@/locales/es/common.json"
import enAuth from "@/locales/en/auth.json"
import esAuth from "@/locales/es/auth.json"
import enDashboard from "@/locales/en/dashboard.json"
import esDashboard from "@/locales/es/dashboard.json"
import enEvaluations from "@/locales/en/evaluations.json"
import esEvaluations from "@/locales/es/evaluations.json"
import enFunded from "@/locales/en/funded.json"
import esFunded from "@/locales/es/funded.json"
import enPayouts from "@/locales/en/payouts.json"
import esPayouts from "@/locales/es/payouts.json"
import enBacktest from "@/locales/en/backtest.json"
import esBacktest from "@/locales/es/backtest.json"
import enCalculator from "@/locales/en/calculator.json"
import esCalculator from "@/locales/es/calculator.json"
import enBankrollMc from "@/locales/en/bankroll-mc.json"
import esBankrollMc from "@/locales/es/bankroll-mc.json"

type Obj = Record<string, unknown>

/** Collect all dot-notation leaf paths from a nested object. */
function leafPaths(obj: Obj, prefix = ""): string[] {
  const paths: string[] = []
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      paths.push(...leafPaths(val as Obj, path))
    } else {
      paths.push(path)
    }
  }
  return paths
}

/** Returns keys present in EN but missing in ES. */
function missingInEs(en: Obj, es: Obj): string[] {
  const enPaths = leafPaths(en)
  const esPaths = new Set(leafPaths(es))
  return enPaths.filter((p) => !esPaths.has(p))
}

const namespaces = [
  { name: "common", en: enCommon as Obj, es: esCommon as Obj },
  { name: "auth", en: enAuth as Obj, es: esAuth as Obj },
  { name: "dashboard", en: enDashboard as Obj, es: esDashboard as Obj },
  { name: "evaluations", en: enEvaluations as Obj, es: esEvaluations as Obj },
  { name: "funded", en: enFunded as Obj, es: esFunded as Obj },
  { name: "payouts", en: enPayouts as Obj, es: esPayouts as Obj },
  { name: "backtest", en: enBacktest as Obj, es: esBacktest as Obj },
  { name: "calculator", en: enCalculator as Obj, es: esCalculator as Obj },
  { name: "bankroll-mc", en: enBankrollMc as Obj, es: esBankrollMc as Obj },
]

describe("Locale completeness: es/ mirrors en/ for all namespaces", () => {
  namespaces.forEach(({ name, en, es }) => {
    it(`${name}: no keys missing in es/`, () => {
      const missing = missingInEs(en, es)
      expect(missing).toEqual([])
    })
  })
})
