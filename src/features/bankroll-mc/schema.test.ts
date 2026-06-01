import { describe, it, expect } from 'vitest'
import { bankrollMcFormSchema } from './schema'

const validBase = {
  bankroll: 1000,
  cost: 140,
  payoutProbPct: 30,
  payoutNet: 400,
}

describe('bankrollMcFormSchema', () => {
  it('accepts valid required-only inputs', () => {
    const result = bankrollMcFormSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('accepts valid inputs with targetBankroll', () => {
    const result = bankrollMcFormSchema.safeParse({ ...validBase, targetBankroll: 5000 })
    expect(result.success).toBe(true)
  })

  it('rejects cost = 0', () => {
    const result = bankrollMcFormSchema.safeParse({ ...validBase, cost: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects payoutProbPct = 0', () => {
    const result = bankrollMcFormSchema.safeParse({ ...validBase, payoutProbPct: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects payoutProbPct = 100', () => {
    const result = bankrollMcFormSchema.safeParse({ ...validBase, payoutProbPct: 100 })
    expect(result.success).toBe(false)
  })

  it('rejects targetBankroll <= bankroll', () => {
    const result = bankrollMcFormSchema.safeParse({ ...validBase, targetBankroll: 1000 })
    expect(result.success).toBe(false)
  })

  it('rejects targetBankroll < bankroll', () => {
    const result = bankrollMcFormSchema.safeParse({ ...validBase, targetBankroll: 500 })
    expect(result.success).toBe(false)
  })
})
