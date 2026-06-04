import { z } from "zod"

export const backtestCreateSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80, "Máximo 80 caracteres"),
  bankroll_initial: z.coerce
    .number({ error: "Ingresá un monto válido" })
    .min(0, "El bankroll no puede ser negativo"),
  eval_cost: z.coerce
    .number({ error: "Ingresá un monto válido" })
    .positive("El costo debe ser mayor que 0"),
})
export type BacktestCreateInput = z.infer<typeof backtestCreateSchema>

export const backtestRenameSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80, "Máximo 80 caracteres"),
})
export type BacktestUpdateInput = z.infer<typeof backtestRenameSchema>

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
