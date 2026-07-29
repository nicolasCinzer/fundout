import { z } from "zod"

// ---------------------------------------------------------------------------
// Session schema — versioned localStorage store for backtest trading days.
//
// Guards every localStorage read against corrupt / stale data.
// Satisfies: REQ-LS-01..07
// ---------------------------------------------------------------------------

export const tradeSchema = z.object({
  id: z.string(),
  pnl: z.number(),
})

export const tradingDaySchema = z.object({
  id: z.string(),
  date: z.string().optional(),
  trades: z.array(tradeSchema),
  withdrawal: z.number().optional(),
})

export const backtestSessionStoreSchema = z.object({
  schemaVersion: z.literal(1),
  backtestId: z.string(),
  phase: z.enum(["eval", "funded"]),
  days: z.array(tradingDaySchema),
})

export type BacktestSessionStore = z.infer<typeof backtestSessionStoreSchema>
