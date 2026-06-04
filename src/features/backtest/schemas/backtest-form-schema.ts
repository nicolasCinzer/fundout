import { z } from "zod"

// Reusable optional meta fields — empty string is normalized to null on output.
const optionalShort = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Max ${max} characters`)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .nullable()
    .describe(label)

export const backtestCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Max 80 characters"),
  bankroll_initial: z.coerce
    .number({ error: "Enter a valid amount" })
    .min(0, "Bankroll cannot be negative"),
  eval_cost: z.coerce
    .number({ error: "Enter a valid amount" })
    .positive("Cost must be greater than 0"),
  asset: optionalShort(20, "Asset"),
  period: optionalShort(60, "Period"),
  strategy: optionalShort(500, "Strategy"),
})
export type BacktestCreateInput = z.infer<typeof backtestCreateSchema>

export const backtestUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Max 80 characters"),
  asset: optionalShort(20, "Asset"),
  period: optionalShort(60, "Period"),
  strategy: optionalShort(500, "Strategy"),
})
export type BacktestUpdateInput = z.infer<typeof backtestUpdateSchema>

// Backwards-compatible alias for old rename-only callers
export const backtestRenameSchema = backtestUpdateSchema

// Discriminated union — UI form submits one of these
export const backtestEventAppendSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("E"),
    notes: z.string().max(500).optional().nullable(),
  }),
  z.object({
    type: z.literal("F"),
    notes: z.string().max(500).optional().nullable(),
  }),
  z.object({
    type: z.literal("P"),
    amount: z.coerce.number({ error: "Ingresá un monto válido" }).positive("El monto debe ser mayor que 0"),
    notes: z.string().max(500).optional().nullable(),
  }),
])
export type BacktestEventAppendInput = z.infer<typeof backtestEventAppendSchema>
