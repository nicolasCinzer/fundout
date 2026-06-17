import { describe, it, expect } from 'vitest'
import { runSimulation } from './engine'
import type { BankrollMcInput } from './types'

// ---------------------------------------------------------------------------
// Batch 3 — Single-run helper (tested via public API)
// ---------------------------------------------------------------------------

// Shared fixture for EV-positive scenario
const evPositiveInput: BankrollMcInput = {
  bankroll: 1000,
  cost: 100,
  payoutProb: 0.5,
  payoutNet: 1000, // EV = -100 + 0.5 * 1000 = +400
}

// Shared fixture for EV-negative scenario
const evNegativeInput: BankrollMcInput = {
  bankroll: 1000,
  cost: 100,
  payoutProb: 0.1,
  payoutNet: 200, // EV = -100 + 0.1 * 200 = -80
}

describe('engine — single-run behaviour', () => {
  it('immediate ruin: bankroll < cost → ruinRate=1, no alive cohort past index 0', () => {
    const input: BankrollMcInput = {
      bankroll: 50,
      cost: 100,
      payoutProb: 0.5,
      payoutNet: 200,
    }
    const result = runSimulation(input)
    expect(result.ruinRate).toBe(1)
    expect(result.percentileP50[1]).toBeNull()
  })

  it('trajectory shape: percentileP50[0] equals input bankroll', () => {
    const input: BankrollMcInput = {
      bankroll: 1000,
      cost: 140,
      payoutProb: 0.3,
      payoutNet: 400,
    }
    const result = runSimulation(input)
    expect(result.percentileP50[0]).toBe(input.bankroll)
  })
})

// ---------------------------------------------------------------------------
// Batch 4 — Multi-run aggregation + metrics
// ---------------------------------------------------------------------------

describe('engine — aggregation and metrics', () => {
  it('determinism: two calls with same input return deep-equal metrics', () => {
    const input: BankrollMcInput = {
      bankroll: 1000,
      cost: 140,
      payoutProb: 0.3,
      payoutNet: 400,
    }
    const run1 = runSimulation(input)
    const run2 = runSimulation(input)
    expect(run1.ruinRate).toBe(run2.ruinRate)
    expect(run1.evPerAttempt).toBe(run2.evPerAttempt)
    expect(run1.percentileP50).toEqual(run2.percentileP50)
  })

  it('EV closed-form: evPerAttempt === -cost + payoutProb * payoutNet', () => {
    const input: BankrollMcInput = {
      bankroll: 1000,
      cost: 140,
      payoutProb: 0.3,
      payoutNet: 400,
    }
    const result = runSimulation(input)
    expect(result.evPerAttempt).toBe(-140 + 0.3 * 400)
  })

  it('EV-positive scenario: ruinRate < 0.05, survivalRate > 0.9', () => {
    const result = runSimulation(evPositiveInput)
    expect(result.ruinRate).toBeLessThan(0.05)
    expect(result.survivalRate).toBeGreaterThan(0.9)
    expect(result.evPerAttempt).toBeGreaterThan(0)
  })

  it('EV-negative scenario: ruinRate > 0.5, evPerAttempt < 0', () => {
    const result = runSimulation(evNegativeInput)
    expect(result.ruinRate).toBeGreaterThan(0.5)
    expect(result.evPerAttempt).toBeLessThan(0)
  })

  it('no ruined runs: avgAttemptsToRuin === 0 (not NaN)', () => {
    // Huge bankroll → zero ruin
    const input: BankrollMcInput = {
      bankroll: 1e9,
      cost: 100,
      payoutProb: 0.5,
      payoutNet: 200,
    }
    const result = runSimulation(input)
    expect(result.ruinRate).toBe(0)
    expect(result.avgAttemptsToRuin).toBe(0)
    expect(Number.isNaN(result.avgAttemptsToRuin)).toBe(false)
  })

  it('huge bankroll: ruinRate === 0, percentile cohort survives to index 100', () => {
    const input: BankrollMcInput = {
      bankroll: 1e9,
      cost: 100,
      payoutProb: 0.5,
      payoutNet: 200,
    }
    const result = runSimulation(input)
    expect(result.ruinRate).toBe(0)
    expect(result.percentileP50[100]).not.toBeNull()
  })

  it('simCount constant is 10000 (triangulation: consistent with ruinRate denominator)', () => {
    const input: BankrollMcInput = {
      bankroll: 1000,
      cost: 140,
      payoutProb: 0.3,
      payoutNet: 400,
    }
    const result = runSimulation(input)
    expect(result.simCount).toBe(10000)
  })
})

// ---------------------------------------------------------------------------
// Batch 5 — Percentile bands
// ---------------------------------------------------------------------------

describe('engine — percentile bands', () => {
  it('percentileP50 at index 0 is defined (all runs alive at start)', () => {
    const input: BankrollMcInput = {
      bankroll: 1000,
      cost: 140,
      payoutProb: 0.3,
      payoutNet: 400,
    }
    const result = runSimulation(input)
    expect(result.percentileP50[0]).not.toBeNull()
    expect(typeof result.percentileP50[0]).toBe('number')
  })

  it('percentile null cohort: all runs ruin at attempt 0 → percentileP10[1] === null', () => {
    // bankroll < cost → every run has aliveLen === 1, meaning only index 0 is valid
    // index 1 has an empty cohort → null
    const input: BankrollMcInput = {
      bankroll: 50,
      cost: 100,
      payoutProb: 0.5,
      payoutNet: 200,
    }
    const result = runSimulation(input)
    expect(result.percentileP10[1]).toBeNull()
    expect(result.percentileP50[1]).toBeNull()
    expect(result.percentileP90[1]).toBeNull()
  })

  it('percentile bands have length 101', () => {
    const input: BankrollMcInput = {
      bankroll: 1000,
      cost: 140,
      payoutProb: 0.3,
      payoutNet: 400,
    }
    const result = runSimulation(input)
    expect(result.percentileP10.length).toBe(101)
    expect(result.percentileP50.length).toBe(101)
    expect(result.percentileP90.length).toBe(101)
  })
})

// ---------------------------------------------------------------------------
// Batch 7 — Target metric + public API
// ---------------------------------------------------------------------------

describe('engine — target metric (pReachTarget)', () => {
  it('pReachTarget > 0.9 when target is reachable (slight target, positive EV)', () => {
    const input: BankrollMcInput = {
      bankroll: 1000,
      cost: 100,
      payoutProb: 0.5,
      payoutNet: 1000, // strongly positive EV
      targetBankroll: 1010, // just barely above start
    }
    const result = runSimulation(input)
    expect(result.pReachTarget).toBeGreaterThan(0.9)
  })

  it('pReachTarget near 0 when target is unreachable (100× bankroll, negative EV)', () => {
    const input: BankrollMcInput = {
      ...evNegativeInput,
      targetBankroll: evNegativeInput.bankroll * 100,
    }
    const result = runSimulation(input)
    expect(result.pReachTarget).toBeLessThan(0.01)
  })

  it('pReachTarget is 0 when targetBankroll is undefined', () => {
    const input: BankrollMcInput = {
      bankroll: 1000,
      cost: 140,
      payoutProb: 0.3,
      payoutNet: 400,
    }
    const result = runSimulation(input)
    expect(result.pReachTarget).toBe(0)
  })
})
