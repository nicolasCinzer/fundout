import { z } from 'zod'

export const bankrollMcFormSchema = z
  .object({
    bankroll: z.number().positive(),
    cost: z.number().positive(),
    payoutProb: z.number().gt(0).lt(1),
    payoutNet: z.number().positive(),
    targetBankroll: z.number().positive().optional(),
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

export type BankrollMcFormValues = z.infer<typeof bankrollMcFormSchema>

export const bankrollMcFormDefaults: BankrollMcFormValues = {
  bankroll: 1000,
  cost: 140,
  payoutProb: 0.3,
  payoutNet: 400,
  targetBankroll: 5000,
}
