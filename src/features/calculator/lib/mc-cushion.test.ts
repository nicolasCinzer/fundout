import { describe, it, expect } from 'vitest'
import { simulateMcCushion } from './mc-cushion'
import type { PhaseInput } from '../types'

const fundedBase: PhaseInput = {
  dd: 2000,
  objective: 2600,
  minDays: 5,
  minProfit: 150,
  ddType: 'eod',
  ddFixed: true,
  isFunded: true,
  payoutCapPct: 0.5,
  splitPct: 0.9,
}

describe('simulateMcCushion', () => {
  it('returns null when minDays is missing', () => {
    const { minDays: _, ...rest } = fundedBase
    expect(simulateMcCushion(rest as PhaseInput)).toBeNull()
  })

  it('returns null when minProfit is missing', () => {
    const { minProfit: _, ...rest } = fundedBase
    expect(simulateMcCushion(rest as PhaseInput)).toBeNull()
  })

  it('returns null when minProfit is 0', () => {
    expect(simulateMcCushion({ ...fundedBase, minProfit: 0 })).toBeNull()
  })

  it('returns null when dd is 0', () => {
    expect(simulateMcCushion({ ...fundedBase, dd: 0 })).toBeNull()
  })

  it('expectedPayout close to analytic gross (1170) for Lucid Flex 50k funded', () => {
    const result = simulateMcCushion(fundedBase, { seed: 42, iterations: 10_000 })!
    expect(result.expectedPayout).toBeGreaterThan(1100)
    expect(result.expectedPayout).toBeLessThan(1240)
  })

  it('determinism — same seed/iters produces identical result', () => {
    const a = simulateMcCushion(fundedBase, { seed: 42, iterations: 10_000 })!
    const b = simulateMcCushion(fundedBase, { seed: 42, iterations: 10_000 })!
    expect(a.pFunded).toBe(b.pFunded)
    expect(a.expectedPayout).toBe(b.expectedPayout)
    expect(a.payoutStdDev).toBe(b.payoutStdDev)
  })

  it('minDays=1 with objective=dd → P(pass) ≈ 0.5 (symmetric 1:1 day-1 trade)', () => {
    const result = simulateMcCushion(
      { ...fundedBase, objective: 2000, minDays: 1 },
      { seed: 42, iterations: 100_000 },
    )!
    expect(result.pFunded).toBeGreaterThan(0.48)
    expect(result.pFunded).toBeLessThan(0.52)
  })

  it('minDays=1 with objective=1.5×dd → P(pass) = dd/(dd+objective) = 0.4', () => {
    const result = simulateMcCushion(
      { ...fundedBase, objective: 3000, minDays: 1 },
      { seed: 42, iterations: 100_000 },
    )!
    expect(result.pFunded).toBeGreaterThan(0.38)
    expect(result.pFunded).toBeLessThan(0.42)
  })

  it('minPayoutRequest=$500 → pFunded lower than without floor', () => {
    const noFloor = simulateMcCushion(fundedBase, { seed: 42, iterations: 10_000 })!
    const withFloor = simulateMcCushion(
      { ...fundedBase, minPayoutRequest: 500 },
      { seed: 42, iterations: 10_000 },
    )!
    expect(withFloor.pFunded).toBeLessThan(noFloor.pFunded)
    expect(withFloor.expectedPayout).toBeGreaterThan(0)
  })

  it('absurdly high minPayoutRequest → pFunded=0', () => {
    const result = simulateMcCushion(
      { ...fundedBase, minPayoutRequest: 99999 },
      { seed: 42, iterations: 10_000 },
    )!
    expect(result.pFunded).toBe(0)
    expect(result.expectedPayout).toBe(0)
  })

  it('10k iterations complete in under 50ms', () => {
    const start = performance.now()
    simulateMcCushion(fundedBase, { seed: 42, iterations: 10_000 })
    expect(performance.now() - start).toBeLessThan(50)
  })
})
