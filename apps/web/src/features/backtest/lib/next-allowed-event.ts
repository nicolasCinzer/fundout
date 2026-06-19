import type { BacktestEvent, BacktestEventType } from "../types"

/**
 * Pure function. Given the last event in the log (or null for empty log),
 * returns the set of event types the user is allowed to append next.
 *
 * Rules:
 *   null → ["E"]           empty log — must start with an eval
 *   E    → ["E", "F"]     can start another eval or fund the current one
 *   F    → ["E", "P"]     can blow into a new eval or take a payout
 *   P    → ["E", "P"]     can blow into a new eval or take another payout
 */
export function nextAllowedEvent(
  last: BacktestEvent | null,
): BacktestEventType[] {
  if (last === null) return ["E"]
  if (last.type === "E") return ["E", "F"]
  if (last.type === "F") return ["E", "P"]
  if (last.type === "P") return ["E", "P"]
  return ["E"] // defensive fallback
}
