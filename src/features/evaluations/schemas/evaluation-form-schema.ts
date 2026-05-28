import { z } from "zod"

const STATUSES = ["in_progress", "passed", "failed"] as const

export const evaluationFormSchema = z
  .object({
    propfirm_id: z.string().min(1, "Select a propfirm"),
    account_size: z.coerce
      .number({ error: "Enter a valid amount" })
      .positive("Must be greater than 0"),
    fee_paid: z.coerce
      .number({ error: "Enter a valid amount" })
      .min(0, "Cannot be negative"),
    purchase_date: z
      .string()
      .min(1, "Pick a purchase date")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    status: z.enum(STATUSES),
    closed_at: z.string().optional().or(z.literal("")),
    notes: z.string().max(500, "Max 500 characters").optional().or(z.literal("")),
  })
  .refine(
    (d) =>
      d.status === "in_progress"
        ? !d.closed_at
        : !!d.closed_at && d.closed_at.length > 0,
    {
      message: "Closed evaluations need a closing date",
      path: ["closed_at"],
    },
  )
  .refine(
    (d) => !d.closed_at || d.closed_at >= d.purchase_date,
    {
      message: "Closing date cannot be before the purchase date",
      path: ["closed_at"],
    },
  )

export type EvaluationFormInput = z.input<typeof evaluationFormSchema>
export type EvaluationFormValues = z.output<typeof evaluationFormSchema>

export const evaluationEditFormSchema = z.object({
  propfirm_id: z.string().min(1, "Select a propfirm"),
  account_size: z.coerce
    .number({ error: "Enter a valid amount" })
    .positive("Must be greater than 0"),
  fee_paid: z.coerce
    .number({ error: "Enter a valid amount" })
    .min(0, "Cannot be negative"),
  purchase_date: z
    .string()
    .min(1, "Pick a purchase date")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  notes: z.string().max(500, "Max 500 characters").optional().or(z.literal("")),
})

export type EvaluationEditFormInput = z.input<typeof evaluationEditFormSchema>
export type EvaluationEditFormValues = z.output<typeof evaluationEditFormSchema>
