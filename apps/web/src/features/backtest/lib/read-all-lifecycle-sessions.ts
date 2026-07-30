import { readSession } from "./session-store"
import type { Lifecycle, TradingDay } from "../types"

export type LifecycleSession = {
  eval: TradingDay[]
  funded: TradingDay[]
}

/**
 * Read localStorage sessions for ALL provided lifecycles.
 *
 * For each lifecycle, reads both the eval and funded phases independently.
 * Tolerant of missing sessions (returns empty arrays — no localStorage session
 * means zero trades, not an error). Never throws.
 *
 * Key format (inherited from session-store.ts):
 *   `fundout:backtest-session:v1:{backtestId}:{lifecycleKey}:{phase}`
 * where `lifecycleKey = lifecycle.evalEvent.id` (the E event's id, not lifecycle_id —
 * this matches existing localStorage data and avoids re-keying).
 *
 * Satisfies: REQ-MA-LS-01..03, Design §4.
 */
export function readAllLifecycleSessions(
  backtestId: string,
  lifecycles: Lifecycle[],
): Map<string, LifecycleSession> {
  const result = new Map<string, LifecycleSession>()

  for (const lc of lifecycles) {
    const key = lc.evalEvent.id
    try {
      const evalDays = readSession(backtestId, key, "eval")
      const fundedDays = readSession(backtestId, key, "funded")
      result.set(key, { eval: evalDays, funded: fundedDays })
    } catch {
      // Corrupt or missing session — treat as empty (no trades yet)
      result.set(key, { eval: [], funded: [] })
    }
  }

  return result
}
