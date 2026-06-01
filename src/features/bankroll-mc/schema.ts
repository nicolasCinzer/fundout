import { z } from 'zod'

export const bankrollMcFormSchema = z
  .object({
    bankroll: z.number().positive(),
    cost: z.number().positive(),
    payoutProbPct: z.number().gt(0).lt(100),
    payoutNet: z.number().positive(),
    targetBankroll: z.number().positive().optional(),
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

export type BankrollMcFormValues = z.infer<typeof bankrollMcFormSchema>

export const bankrollMcFormDefaults: Partial<BankrollMcFormValues> = {
  bankroll: 1000,
  cost: 140,
  payoutProbPct: 30,
  payoutNet: 400,
}
