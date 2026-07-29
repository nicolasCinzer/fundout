import { backtestSessionStoreSchema } from "../schemas/session-schema"
import type { Phase, TradingDay } from "../types"

// ---------------------------------------------------------------------------
// Backtest session store — pure localStorage adapter.
//
// Key scheme: `fundout:backtest-session:v1:{backtestId}:{phase}`
// Two independent stores per backtest (eval, funded).
//
// Corrupt / stale / version-mismatched payloads → return [] (never throw).
// Derived state is NEVER persisted here — only raw TradingDay[].
//
// Satisfies: REQ-LS-01..07, SCENARIO LS-1..7
// ---------------------------------------------------------------------------

/**
 * Returns the localStorage key for a given backtest + lifecycle attempt + phase.
 *
 * Key format: `fundout:backtest-session:v1:{backtestId}:{lifecycleKey}:{phase}`
 *
 * - `lifecycleKey` is the eval event id that opened the current lifecycle.
 *   This ensures each eval attempt and its funded phase get a FRESH store.
 *   Use "init" for a backtest with no events yet.
 */
export function keyFor(backtestId: string, lifecycleKey: string, phase: Phase): string {
  return `fundout:backtest-session:v1:${backtestId}:${lifecycleKey}:${phase}`
}

/**
 * Read trading days from localStorage.
 * Returns [] on any error: corrupt JSON, schema version mismatch,
 * phase mismatch, or missing required fields. Never throws.
 */
export function readSession(backtestId: string, lifecycleKey: string, phase: Phase): TradingDay[] {
  try {
    const raw = localStorage.getItem(keyFor(backtestId, lifecycleKey, phase))
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    const result = backtestSessionStoreSchema.safeParse(parsed)
    if (!result.success) return []

    // Phase mismatch guard (LS-7): payload.phase must match the requested phase.
    if (result.data.phase !== phase) return []

    return result.data.days
  } catch {
    return []
  }
}

/** Persist trading days to localStorage. */
export function writeSession(
  backtestId: string,
  lifecycleKey: string,
  phase: Phase,
  days: TradingDay[],
): void {
  const payload = {
    schemaVersion: 1 as const,
    backtestId,
    phase,
    days,
  }
  localStorage.setItem(keyFor(backtestId, lifecycleKey, phase), JSON.stringify(payload))
}

/** Remove the stored session for a given backtest + lifecycle attempt + phase. */
export function clearSession(backtestId: string, lifecycleKey: string, phase: Phase): void {
  localStorage.removeItem(keyFor(backtestId, lifecycleKey, phase))
}
