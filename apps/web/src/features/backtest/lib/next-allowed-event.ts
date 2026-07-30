import type { BacktestEvent, BacktestEventType } from "../types"

/**
 * Pure function. Given the last event in the SELECTED lifecycle (or null),
 * returns the set of event types the user is allowed to append next for
 * that lifecycle.
 *
 * Caller is responsible for passing the selected lifecycle's last event
 * (via lastEventOfLifecycle), NOT the global last event across all lifecycles.
 *
 * Rules:
 *   null → ["E"]           selected lifecycle is empty (or nothing selected)
 *   E    → ["E", "F"]     can open another lifecycle or fund the selected one
 *   F    → ["E", "P"]     can open another lifecycle or take payout from selected
 *   P    → ["E", "P"]     can open another lifecycle or take another payout
 *
 * Note: "New evaluation" (E) is ALWAYS in the allowed set and bypasses this
 * function entirely at the call site — it goes directly to appendEvent.
 * This function gates only the WITHIN-selected-account actions (F, P).
 *
 * Satisfies: REQ-MA-NAE-01..04, ADR-4.
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

/**
 * Returns the last event (max position) from the given events array that
 * belongs to the specified lifecycle_id.
 *
 * Used to scope nextAllowedEvent to the SELECTED lifecycle so that
 * interleaved appends across multiple lifecycles don't affect each other's gates.
 *
 * @param events     All events for a backtest (sorted by position ASC)
 * @param lifecycleId  The lifecycle whose last event is needed
 * @returns The event with the highest position for this lifecycle, or null
 *
 * Satisfies: REQ-MA-NAE-01, ADR-4.
 */
export function lastEventOfLifecycle(
  events: BacktestEvent[],
  lifecycleId: string,
): BacktestEvent | null {
  let last: BacktestEvent | null = null
  for (const ev of events) {
    if (ev.lifecycle_id === lifecycleId) {
      if (last === null || ev.position > last.position) {
        last = ev
      }
    }
  }
  return last
}
