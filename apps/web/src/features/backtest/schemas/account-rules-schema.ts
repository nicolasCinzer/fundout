import { z } from "zod"

// ---------------------------------------------------------------------------
// accountRulesSchema
//
// Maps 1:1 to the DB snake_case columns for direct use as a patch payload.
// Used with manual safeParse at RHF submit — NOT with zodResolver.
//
// Refinement #1 (all-or-nothing CORE): if ANY of the four CORE fields is
//   provided, ALL four must be provided. Partial CORE = error on each missing.
// Refinement #2 (pairing): eval_min_profit_days ⇔ eval_min_profit_amount.
//   Both or neither. Violating the pair = error on the missing field.
// Refinement #3 (pairing): funded_min_profit_days ⇔ funded_min_profit_amount.
//   Both or neither. Violating the pair = error on the missing field.
//
// Satisfies: REQ-VAL-01..05, SCENARIO DB-1..8
// ---------------------------------------------------------------------------

const optionalPositiveNumber = z.coerce
  .number()
  .positive()
  .nullable()
  .optional()
  .transform((v) => v ?? null)

const optionalPct = z.coerce
  .number()
  .gt(0, "Must be greater than 0")
  .lte(1, "Must be ≤ 1")
  .nullable()
  .optional()
  .transform((v) => v ?? null)

export const accountRulesSchema = z
  .object({
    // CORE fields
    dd_starting_balance: optionalPositiveNumber,
    dd_amount: optionalPositiveNumber,
    dd_type: z
      .enum(["EOD", "Intraday"])
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    eval_profit_target: optionalPositiveNumber,
    // Optional add-ons
    eval_consistency_pct: optionalPct,
    eval_min_profit_days: z.coerce
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    eval_min_profit_amount: optionalPositiveNumber,
    funded_consistency_pct: optionalPct,
    funded_min_profit_days: z.coerce
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    funded_min_profit_amount: optionalPositiveNumber,
  })
  // Refinement #1: all-or-nothing CORE
  .superRefine((data, ctx) => {
    const coreFields = [
      "dd_starting_balance",
      "dd_amount",
      "dd_type",
      "eval_profit_target",
    ] as const

    const presentCount = coreFields.filter((f) => data[f] !== null && data[f] !== undefined).length

    if (presentCount > 0 && presentCount < 4) {
      // Some but not all CORE fields are provided — error on each missing one
      for (const field of coreFields) {
        if (data[field] === null || data[field] === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: "All four CORE fields are required together (dd_starting_balance, dd_amount, dd_type, eval_profit_target).",
          })
        }
      }
    }
  })
  // Refinement #2: eval min-profit pairing
  .superRefine((data, ctx) => {
    const hasDays = data.eval_min_profit_days !== null && data.eval_min_profit_days !== undefined
    const hasAmount = data.eval_min_profit_amount !== null && data.eval_min_profit_amount !== undefined

    if (hasDays && !hasAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eval_min_profit_amount"],
        message: "eval_min_profit_amount is required when eval_min_profit_days is set.",
      })
    }
    if (hasAmount && !hasDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eval_min_profit_days"],
        message: "eval_min_profit_days is required when eval_min_profit_amount is set.",
      })
    }
  })
  // Refinement #3: funded min-profit pairing
  .superRefine((data, ctx) => {
    const hasDays = data.funded_min_profit_days !== null && data.funded_min_profit_days !== undefined
    const hasAmount = data.funded_min_profit_amount !== null && data.funded_min_profit_amount !== undefined

    if (hasDays && !hasAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["funded_min_profit_amount"],
        message: "funded_min_profit_amount is required when funded_min_profit_days is set.",
      })
    }
    if (hasAmount && !hasDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["funded_min_profit_days"],
        message: "funded_min_profit_days is required when funded_min_profit_amount is set.",
      })
    }
  })

export type AccountRulesInput = z.infer<typeof accountRulesSchema>
