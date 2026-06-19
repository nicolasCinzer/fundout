import { describe, it, expect } from 'vitest'
import { mulberry32 } from './prng'

describe('mulberry32', () => {
  it('same seed produces identical sequence', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b())
    }
  })

  it('different seeds produce different sequences', () => {
    const a = mulberry32(42)
    const b = mulberry32(43)
    let differ = false
    for (let i = 0; i < 100; i++) {
      if (a() !== b()) {
        differ = true
        break
      }
    }
    expect(differ).toBe(true)
  })

  it('values land in [0, 1)', () => {
    const rng = mulberry32(42)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
