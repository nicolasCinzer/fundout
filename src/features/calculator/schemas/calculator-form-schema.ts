import { z } from 'zod'

const phaseSchema = z.object({
  dd: z.number().positive(),
  objective: z.number().positive(),
  ddType: z.enum(['static', 'eod', 'trailing']),
  ddFixed: z.boolean(),
  isFunded: z.boolean(),

  consistencyPct: z.number().gt(0).lte(100).optional(),
  minDays: z.number().int().gte(1).optional(),
  minProfit: z.number().positive().optional(),

  payoutCapPct: z.number().gt(0).lte(100).optional(),
  splitPct: z.number().gt(0).lte(100).optional(),
}).superRefine((p, ctx) => {
  if (p.minDays !== undefined && p.minProfit === undefined) {
    ctx.addIssue({ code: 'custom', path: ['minProfit'], message: 'Required when min days is set' })
  }
  if (p.consistencyPct !== undefined && p.minDays !== undefined) {
    ctx.addIssue({ code: 'custom', path: ['minDays'], message: 'Cannot combine consistency and min-days' })
  }
  if (p.isFunded) {
    if (p.payoutCapPct === undefined) ctx.addIssue({ code: 'custom', path: ['payoutCapPct'], message: 'Required for funded phase' })
    if (p.splitPct === undefined)     ctx.addIssue({ code: 'custom', path: ['splitPct'],     message: 'Required for funded phase' })
  }
})

export const calculatorFormSchema = z.object({
  cEval: z.number().gte(0),
  cActivation: z.number().gte(0),
  phases: z.array(phaseSchema).min(1).max(4),
}).superRefine((v, ctx) => {
  const fundedIndexes = v.phases.flatMap((p, i) => p.isFunded ? [i] : [])
  if (fundedIndexes.length > 1) {
    ctx.addIssue({ code: 'custom', path: ['phases'], message: 'Only one phase may be funded' })
  }
  if (fundedIndexes.length === 1 && fundedIndexes[0] !== v.phases.length - 1) {
    ctx.addIssue({ code: 'custom', path: ['phases', fundedIndexes[0], 'isFunded'], message: 'Funded phase must be last' })
  }
})

export type CalculatorFormValues = z.infer<typeof calculatorFormSchema>
