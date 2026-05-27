import { z } from "zod"

export const payoutFormSchema = z
  .object({
    funded_account_id: z.string().min(1, "Pick a funded account"),
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
  .refine((d) => d.fee_taken <= d.amount, {
    message: "Fee cannot exceed amount",
    path: ["fee_taken"],
  })

export type PayoutFormInput = z.input<typeof payoutFormSchema>
export type PayoutFormValues = z.output<typeof payoutFormSchema>
