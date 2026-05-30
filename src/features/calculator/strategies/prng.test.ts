import { describe, it, expect } from 'vitest'
import { mulberry32, DEFAULT_SEED } from './prng'

describe('mulberry32', () => {
  it('snapshot — same first 10 values on every call with seed=42', () => {
    const rng = mulberry32(42)
    const values = Array.from({ length: 10 }, () => rng())
    // Snapshot: deterministic sequence for seed=42
    expect(values).toMatchSnapshot()
  })

  it('two independent instances with seed=42 produce identical sequences', () => {
    const rng1 = mulberry32(42)
    const rng2 = mulberry32(42)
    const seq1 = Array.from({ length: 20 }, () => rng1())
    const seq2 = Array.from({ length: 20 }, () => rng2())
    expect(seq1).toEqual(seq2)
  })

  it('mulberry32(42) first output differs from mulberry32(43) first output', () => {
    const first42 = mulberry32(42)()
    const first43 = mulberry32(43)()
    expect(first42).not.toBe(first43)
  })

  it('DEFAULT_SEED is 42', () => {
    expect(DEFAULT_SEED).toBe(42)
  })
})
