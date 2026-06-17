import { z } from "zod"

const payoutFieldsSchema = z.object({
  amount: z.coerce
    .number({ error: "Enter a valid amount" })
    .positive("Amount must be greater than 0"),
  fee_taken: z.coerce
    .number({ error: "Enter a valid amount" })
    .min(0, "Fee cannot be negative"),
  paid_at: z
    .string()
    .min(1, "Pick a payout date")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  notes: z
    .string()
    .max(500, "Max 500 characters")
    .optional()
    .or(z.literal("")),
})

const feeConstraint = (
  d: { amount: number; fee_taken: number },
  ctx: z.RefinementCtx,
) => {
  if (d.fee_taken > d.amount) {
    ctx.addIssue({
      code: "custom",
      message: "Fee cannot exceed amount",
      path: ["fee_taken"],
    })
  }
}

export const payoutFormSchema = payoutFieldsSchema
  .extend({
    funded_account_id: z.string().min(1, "Pick a funded account"),
  })
  .superRefine(feeConstraint)

export type PayoutFormInput = z.input<typeof payoutFormSchema>
export type PayoutFormValues = z.output<typeof payoutFormSchema>

export const payoutEditSchema = payoutFieldsSchema.superRefine(feeConstraint)

export type PayoutEditInput = z.input<typeof payoutEditSchema>
export type PayoutEditValues = z.output<typeof payoutEditSchema>
