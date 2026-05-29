import { describe, it, expect } from 'vitest'
import { computeStrategy, simulateDDFloor, calculate } from './calc-engine'
import type { PhaseInput, CalcInput } from '../types'

// ---------------------------------------------------------------------------
// computeStrategy
// ---------------------------------------------------------------------------

describe('computeStrategy', () => {
  it('consistency branch — 50% cap yields 2 days', () => {
    const result = computeStrategy({ dd: 2000, objective: 3000, ddType: 'eod', ddFixed: false, isFunded: false, consistencyPct: 0.5 })
    expect(result.strategy).toBe('consistency')
    expect(result.days).toBe(2)
    expect(result.dailyTargets).toEqual([1500, 1500])
  })

  it('consistency branch — consistencyPct=1.0 degenerates to 1 day (single-shot equivalent)', () => {
    const result = computeStrategy({ dd: 2000, objective: 3000, ddType: 'eod', ddFixed: false, isFunded: false, consistencyPct: 1.0 })
    expect(result.strategy).toBe('consistency')
    expect(result.days).toBe(1)
    expect(result.dailyTargets).toEqual([3000])
  })

  it('consistency branch — front-loads cap, residual on last day (not equal targets)', () => {
    // obj=3000, consistencyPct=0.4 → cap=1200, days=3 → [1200, 1200, 600], NOT [1200, 1200, 1200]
    const result = computeStrategy({ dd: 2000, objective: 3000, ddType: 'eod', ddFixed: false, isFunded: false, consistencyPct: 0.4 })
    expect(result.strategy).toBe('consistency')
    expect(result.days).toBe(3)
    expect(result.dailyTargets).toEqual([1200, 1200, 600])
  })

  it('min-days branch — exact fit (no gap, no overshoot)', () => {
    const result = computeStrategy({ dd: 2000, objective: 2600, ddType: 'eod', ddFixed: true, isFunded: true, minDays: 5, minProfit: 150 })
    expect(result.strategy).toBe('min-days')
    expect(result.days).toBe(5)
    expect(result.dailyTargets).toEqual([2000, 150, 150, 150, 150])
  })

  it('min-days branch — extra concentrated on day 1 when minProfit floor < objective', () => {
    // obj=3000, minDays=3, minProfit=100 → floor=300, extra=2700 → day 1 = 2800
    const result = computeStrategy({ dd: 2000, objective: 3000, ddType: 'eod', ddFixed: false, isFunded: false, minDays: 3, minProfit: 100 })
    expect(result.strategy).toBe('min-days')
    expect(result.days).toBe(3)
    expect(result.dailyTargets).toEqual([2800, 100, 100])
  })

  it('min-days branch — minProfit floor satisfies objective, all days at minProfit', () => {
    // obj=1000, minDays=3, minProfit=400 → floor=1200 ≥ obj, all days at minProfit (overshoots)
    const result = computeStrategy({ dd: 2000, objective: 1000, ddType: 'eod', ddFixed: false, isFunded: false, minDays: 3, minProfit: 400 })
    expect(result.strategy).toBe('min-days')
    expect(result.days).toBe(3)
    expect(result.dailyTargets).toEqual([400, 400, 400])
  })

  it('min-days branch — minDays=1 puts entire objective on day 1', () => {
    const result = computeStrategy({ dd: 2000, objective: 5000, ddType: 'eod', ddFixed: false, isFunded: false, minDays: 1, minProfit: 100 })
    expect(result.strategy).toBe('min-days')
    expect(result.days).toBe(1)
    expect(result.dailyTargets).toEqual([5000])
  })

  it('min-days branch — lowering objective reduces day-1 target (extra shrinks)', () => {
    // Same dd/minDays/minProfit, two objectives. Lower objective → smaller day 1 → higher pPhase.
    const base = { dd: 1000, ddType: 'eod' as const, ddFixed: true, isFunded: false, minDays: 5, minProfit: 100 }
    const high = computeStrategy({ ...base, objective: 1400 })
    const low = computeStrategy({ ...base, objective: 1000 })
    expect(high.dailyTargets).toEqual([1000, 100, 100, 100, 100])
    expect(low.dailyTargets).toEqual([600, 100, 100, 100, 100])
  })

  it('single-shot branch — no consistency or min-days', () => {
    const result = computeStrategy({ dd: 2000, objective: 4000, ddType: 'eod', ddFixed: false, isFunded: false })
    expect(result.strategy).toBe('single-shot')
    expect(result.days).toBe(1)
    expect(result.dailyTargets).toEqual([4000])
  })
})

// ---------------------------------------------------------------------------
// simulateDDFloor
// ---------------------------------------------------------------------------

describe('simulateDDFloor', () => {
  it('static — ddEffective grows with cumulative profit (ddFixed ignored)', () => {
    const phase: PhaseInput = { dd: 2000, objective: 3000, ddType: 'static', ddFixed: true, isFunded: false }
    const targets = [2000, 1000]
    const result = simulateDDFloor(phase, targets)
    expect(result).toEqual([2000, 4000])
  })

  it('eod without ddFixed — ddEffective is constant at dd', () => {
    const phase: PhaseInput = { dd: 2000, objective: 3000, ddType: 'eod', ddFixed: false, isFunded: false }
    const targets = [1500, 1500]
    const result = simulateDDFloor(phase, targets)
    expect(result).toEqual([2000, 2000])
  })

  it('eod with ddFixed — locks at correct day, transitions to fixed regime', () => {
    const phase: PhaseInput = { dd: 2000, objective: 3000, ddType: 'eod', ddFixed: true, isFunded: false }
    const targets = [500, 500, 500, 500, 500, 500]
    const result = simulateDDFloor(phase, targets)
    expect(result).toEqual([2000, 2000, 2000, 2000, 2000, 2500])
  })

  it('eod with ddFixed — lock never fires if target not reached', () => {
    const phase: PhaseInput = { dd: 2000, objective: 1000, ddType: 'eod', ddFixed: true, isFunded: false }
    const targets = [300, 300, 300]
    const result = simulateDDFloor(phase, targets)
    expect(result).toEqual([2000, 2000, 2000])
  })

  it('eod with ddFixed — Lucid Flex 50k Phase 2 intermediate ddEffective values', () => {
    const phase: PhaseInput = { dd: 2000, objective: 2600, ddType: 'eod', ddFixed: true, isFunded: true, minDays: 5, minProfit: 150 }
    const targets = [2000, 150, 150, 150, 150]
    const result = simulateDDFloor(phase, targets)
    expect(result).toEqual([2000, 2000, 2150, 2300, 2450])
  })
})

// ---------------------------------------------------------------------------
// calculate — Lucid Flex 50k canonical fixture + edge cases
// ---------------------------------------------------------------------------

describe('calculate', () => {
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

  it('Lucid Flex 50k — pPhase1 ≈ 0.3265', () => {
    const result = calculate(lucidFlex50k)
    expect(result.phases[0].pPhase).toBeCloseTo(0.3265, 3)
  })

  it('Lucid Flex 50k — pPhase2 ≈ 0.3846', () => {
    const result = calculate(lucidFlex50k)
    expect(result.phases[1].pPhase).toBeCloseTo(0.3846, 3)
  })

  it('Lucid Flex 50k — pTotal ≈ 0.1255', () => {
    const result = calculate(lucidFlex50k)
    expect(result.pTotal).toBeCloseTo(0.1255, 3)
  })

  it('Lucid Flex 50k — W = 1170.00', () => {
    const result = calculate(lucidFlex50k)
    expect(result.w).toBeCloseTo(1170.0, 2)
  })

  it('Lucid Flex 50k — EV ≈ 6.94 (full-precision; spec stated 6.84 due to rounded pTotal)', () => {
    const result = calculate(lucidFlex50k)
    expect(result.ev).toBeCloseTo(6.94, 1)
  })

  it('Lucid Flex 50k — ROI ≈ 0.0496 (full-precision)', () => {
    const result = calculate(lucidFlex50k)
    expect(result.roi).not.toBeNull()
    expect(result.roi!).toBeCloseTo(0.0496, 3)
  })

  it('cEval=0 → roi === null', () => {
    const input: CalcInput = {
      cEval: 0,
      cActivation: 0,
      phases: [{ dd: 1000, objective: 2000, ddType: 'eod', ddFixed: false, isFunded: false }],
    }
    const result = calculate(input)
    expect(result.roi).toBeNull()
  })

  it('splitPct=0 → w === 0, ev === -cEval', () => {
    const input: CalcInput = {
      cEval: 140,
      cActivation: 0,
      phases: [
        { dd: 2000, objective: 3000, ddType: 'eod', ddFixed: false, isFunded: true, payoutCapPct: 0.5, splitPct: 0 },
      ],
    }
    const result = calculate(input)
    expect(result.w).toBe(0)
    expect(result.ev).toBeCloseTo(-140, 2)
  })

  it('pEval excludes funded phases, pTotal includes all', () => {
    const input: CalcInput = {
      cEval: 0,
      cActivation: 0,
      phases: [
        { dd: 1000, objective: 2000, ddType: 'eod', ddFixed: false, isFunded: false },
        { dd: 1000, objective: 2000, ddType: 'eod', ddFixed: false, isFunded: true, payoutCapPct: 0.5, splitPct: 0.8 },
      ],
    }
    const result = calculate(input)
    expect(result.pEval).toBeCloseTo(result.phases[0].pPhase, 6)
    expect(result.pTotal).toBeCloseTo(result.phases[0].pPhase * result.phases[1].pPhase, 6)
  })
})
