import { z } from "zod"

export const resetFormSchema = z.object({
  fee: z.coerce
    .number({ error: "Enter a valid amount" })
    .positive("Fee must be greater than 0"),
  reset_at: z
    .string()
    .min(1, "Pick a date")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  notes: z.string().max(500, "Max 500 characters").optional().or(z.literal("")),
})

export type ResetFormInput = z.input<typeof resetFormSchema>
export type ResetFormValues = z.output<typeof resetFormSchema>
