import { describe, it, expect } from 'vitest'
import { calculate } from '../lib/calc-engine'
import type { CalcInput } from '../types'
import { analyticRunner } from './analytic'

// Lucid Flex 50k — same fixture as calc-engine.test.ts
const lucidFlex50k: CalcInput = {
  cEval: 140,
  cActivation: 0,
  phases: [
    {
      dd: 2000,
      objective: 3000,
      consistencyPct: 0.5,
      ddType: 'eod',
      ddFixed: false,
      isFunded: false,
    },
    {
      dd: 2000,
      objective: 2600,
      minDays: 5,
      minProfit: 150,
      ddType: 'eod',
      ddFixed: true,
      isFunded: true,
      payoutCapPct: 0.5,
      splitPct: 0.9,
    },
  ],
}

describe('analyticRunner', () => {
  it('pPass === calculate(input).pTotal', () => {
    const result = analyticRunner.run(lucidFlex50k)
    const calc = calculate(lucidFlex50k)
    expect(result.pPass).toBeCloseTo(calc.pTotal, 10)
  })

  it('expectedPayout === calculate(input).w', () => {
    const result = analyticRunner.run(lucidFlex50k)
    const calc = calculate(lucidFlex50k)
    expect(result.expectedPayout).toBeCloseTo(calc.w, 10)
  })

  it('evNetOfFees === calculate(input).ev', () => {
    const result = analyticRunner.run(lucidFlex50k)
    const calc = calculate(lucidFlex50k)
    expect(result.evNetOfFees).toBeCloseTo(calc.ev, 10)
  })

  it('payoutP5 === payoutP50 === payoutP95 === w', () => {
    const result = analyticRunner.run(lucidFlex50k)
    const calc = calculate(lucidFlex50k)
    expect(result.payoutP5).toBeCloseTo(calc.w, 10)
    expect(result.payoutP50).toBeCloseTo(calc.w, 10)
    expect(result.payoutP95).toBeCloseTo(calc.w, 10)
  })

  it('payoutStdDev === 0', () => {
    const result = analyticRunner.run(lucidFlex50k)
    expect(result.payoutStdDev).toBe(0)
  })

  it('applicable === true for any valid CalcInput', () => {
    const result = analyticRunner.run(lucidFlex50k)
    expect(result.applicable).toBe(true)
  })

  it('all required StrategyResult fields present and non-null', () => {
    const result = analyticRunner.run(lucidFlex50k)
    expect(result.strategyId).toBeTruthy()
    expect(result.label).toBeTruthy()
    expect(result.description).toBeTruthy()
    expect(result.kind).toBe('deterministic')
    expect(typeof result.pPass).toBe('number')
    expect(typeof result.pEval).toBe('number')
    expect(typeof result.pFunded).toBe('number')
    expect(typeof result.expectedPayout).toBe('number')
    expect(typeof result.payoutP5).toBe('number')
    expect(typeof result.payoutP50).toBe('number')
    expect(typeof result.payoutP95).toBe('number')
    expect(typeof result.payoutStdDev).toBe('number')
    expect(typeof result.evNetOfFees).toBe('number')
  })

  it('pEval matches product of non-funded phase probabilities', () => {
    const result = analyticRunner.run(lucidFlex50k)
    const calc = calculate(lucidFlex50k)
    expect(result.pEval).toBeCloseTo(calc.pEval, 10)
  })

  it('pFunded = pPass / pEval when pEval > 0', () => {
    const result = analyticRunner.run(lucidFlex50k)
    expect(result.pFunded).toBeCloseTo(result.pPass / result.pEval, 10)
  })
})
