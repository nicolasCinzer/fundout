import { describe, it, expect } from 'vitest'
import { bankrollMcFormSchema } from './schema'

const validBase = {
  bankroll: 1000,
  cost: 140,
  payoutProb: 0.3,
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

  it('rejects payoutProb = 0', () => {
    const result = bankrollMcFormSchema.safeParse({ ...validBase, payoutProb: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects payoutProb = 1', () => {
    const result = bankrollMcFormSchema.safeParse({ ...validBase, payoutProb: 1 })
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
