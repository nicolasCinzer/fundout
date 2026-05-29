import type { CalcInput } from '../types'
import type { CalculatorFormValues } from '../schemas/calculator-form-schema'

export function formValuesToCalcInput(values: CalculatorFormValues): CalcInput {
  return {
    cEval: values.cEval,
    cActivation: values.cActivation,
    phases: values.phases.map(p => ({
      dd: p.dd,
      objective: p.objective,
      ddType: p.ddType,
      ddFixed: p.ddFixed,
      isFunded: p.isFunded,
      consistencyPct: p.consistencyPct !== undefined ? p.consistencyPct / 100 : undefined,
      minDays: p.minDays,
      minProfit: p.minProfit,
      payoutCapPct: p.payoutCapPct !== undefined ? p.payoutCapPct / 100 : undefined,
      splitPct: p.splitPct !== undefined ? p.splitPct / 100 : undefined,
    })),
  }
}
