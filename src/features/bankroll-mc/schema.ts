import { z } from 'zod'

const requiredNumber = (message = 'Requerido') =>
  z
    .union([z.number(), z.null(), z.undefined()])
    .refine((v): v is number => typeof v === 'number' && !Number.isNaN(v), { message })

export const bankrollMcFormSchema = z
  .object({
    bankroll: requiredNumber().refine((v) => v > 0, { message: 'Debe ser mayor a 0' }),
    cost: requiredNumber().refine((v) => v > 0, { message: 'Debe ser mayor a 0' }),
    payoutProbPct: requiredNumber().refine((v) => v > 0 && v < 100, {
      message: 'Debe estar entre 0 y 100',
    }),
    payoutNet: requiredNumber().refine((v) => v > 0, { message: 'Debe ser mayor a 0' }),
    targetBankroll: z
      .union([z.number(), z.null(), z.undefined()])
      .optional()
      .transform((v) => (v == null ? undefined : v))
      .refine((v) => v === undefined || v > 0, { message: 'Debe ser mayor a 0' }),
  })
  .superRefine((v, ctx) => {
    if (v.targetBankroll !== undefined && v.targetBankroll <= v.bankroll) {
      ctx.addIssue({
        code: 'custom',
        path: ['targetBankroll'],
        message: 'Target debe ser mayor al bankroll',
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
