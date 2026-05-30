import { calculate } from '../lib/calc-engine'
import type { CalcInput } from '../types'
import type { StrategyOptions, StrategyResult, StrategyRunner } from './types'

function runAnalytic(input: CalcInput, _options?: StrategyOptions): StrategyResult {
  const result = calculate(input)
  const { pEval, pTotal, w, ev } = result

  const pFunded = pEval > 0 ? pTotal / pEval : 0

  return {
    strategyId: 'analytic',
    label: 'Analytic',
    description:
      'Exhaustively analytic: computes the exact pass probability using the optimal trading plan for each phase. Zero variance — the answer is the answer.',
    kind: 'deterministic',
    applicable: true,
    pPass: pTotal,
    pEval,
    pFunded,
    expectedPayout: w,
    payoutP5: w,
    payoutP50: w,
    payoutP95: w,
    payoutStdDev: 0,
    payoutP5IfPass: w,
    payoutP95IfPass: w,
    evNetOfFees: ev,
  }
}

export const analyticRunner: StrategyRunner = {
  id: 'analytic',
  label: 'Analytic',
  kind: 'deterministic',
  run: runAnalytic,
}
