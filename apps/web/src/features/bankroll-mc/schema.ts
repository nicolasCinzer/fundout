import { z } from 'zod'

const requiredNumber = (message = 'Required') =>
  z
    .union([z.number(), z.null()])
    .refine((v): v is number => typeof v === 'number' && !Number.isNaN(v), { message })

export const bankrollMcFormSchema = z
  .object({
    bankroll: requiredNumber().refine((v) => v > 0, { message: 'Must be greater than 0' }),
    cost: requiredNumber().refine((v) => v > 0, { message: 'Must be greater than 0' }),
    payoutProbPct: requiredNumber().refine((v) => v > 0 && v < 100, {
      message: 'Must be between 0 and 100',
    }),
    payoutNet: requiredNumber().refine((v) => v > 0, { message: 'Must be greater than 0' }),
    targetBankroll: z
      .union([z.number(), z.null()])
      .optional()
      .transform((v) => (v == null ? undefined : v))
      .refine((v) => v === undefined || v > 0, { message: 'Must be greater than 0' }),
  })
  .superRefine((v, ctx) => {
    if (v.targetBankroll !== undefined && v.targetBankroll <= v.bankroll) {
      ctx.addIssue({
        code: 'custom',
        path: ['targetBankroll'],
        message: 'Target must be greater than bankroll',
      })
    }
  })

export type BankrollMcFormValues = {
  bankroll: number | null
  cost: number | null
  payoutProbPct: number | null
  payoutNet: number | null
  targetBankroll?: number | null
}

export const bankrollMcFormDefaults: BankrollMcFormValues = {
  bankroll: 1000,
  cost: 140,
  payoutProbPct: 30,
  payoutNet: 400,
  targetBankroll: null,
}
