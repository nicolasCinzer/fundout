import type { Lifecycle, LifecycleStatus } from "../types"

/**
 * Duration of the breach animation in milliseconds.
 * After this period, the breached chip is removed from the live selector.
 * Exported for use in the chips component's useEffect timer.
 *
 * Satisfies: ADR-8, REQ-MA-BREACH-02.
 */
export const BREACH_ANIM_MS = 3000

/**
 * Derive the TERMINAL lifecycle status from structural status + breach flag.
 *
 * Rules (from ADR-3 / REQ-MA-STATUS-01):
 *   not breached + no F             → open
 *   not breached + F, 0 payouts     → funded_active
 *   not breached + F, >=1 payout    → funded_paid
 *   breached     + no F             → lost
 *   breached     + F, 0 payouts     → breached_no_payout
 *   breached     + F, >=1 payout    → funded_paid  (Paid trumps later breach)
 *
 * @param lc       Lifecycle from groupLifecycles (structural status)
 * @param breached Whether the lifecycle's localStorage session is breached
 */
export function deriveLifecycleStatus(lc: Lifecycle, breached: boolean): LifecycleStatus {
  const hasFunded = lc.fundedEvent !== null
  const hasPayout = lc.payouts.length > 0

  if (breached) {
    if (hasPayout) return "funded_paid"      // Paid already — breach doesn't revoke payout
    if (hasFunded) return "breached_no_payout"
    return "lost"
  }

  // Not breached — structural status applies directly
  if (hasPayout) return "funded_paid"
  if (hasFunded) return "funded_active"
  return "open"
}

/**
 * Determine if a lifecycle is "live" (eligible for chip display, selection,
 * and trade entry). A lifecycle is live as long as it has not been breached.
 *
 * Note: funded_paid lifecycles remain live (can take further payouts).
 * Only breach makes a lifecycle terminal.
 *
 * Satisfies: REQ-MA-CHIP-01, REQ-MA-CHIP-04, ADR-3.
 */
export function isLifecycleLive(breached: boolean): boolean {
  return !breached
}

/**
 * Pick the selection after a lifecycle breaches.
 *
 * The selection only moves when the breached lifecycle WAS the selected one —
 * a background account breaching must not steal focus. When it was selected,
 * jump to the first still-live lifecycle (excluding the breached id), or null
 * if none remain.
 *
 * This runs when the breach animation completes (after BREACH_ANIM_MS), so the
 * user sees the chip go red before the view moves — matches the intended UX:
 * red → 3s → chip removed + selection jumps.
 *
 * Satisfies: REQ-MA-BREACH-03, ADR-8.
 */
export function nextSelectionAfterBreach(
  breachedId: string,
  liveIds: string[],
  currentSelected: string | null,
): string | null {
  if (currentSelected !== breachedId) return currentSelected
  return liveIds.find((id) => id !== breachedId) ?? null
}

/**
 * Which lifecycle ids JUST crossed into breached — i.e. are breached now but
 * were not breached before. The breach animation must fire ONLY for these, not
 * for already-breached accounts on mount or on every unrelated recompute
 * (adding a payout, opening a new eval, a refetch).
 *
 * The caller seeds `previouslyBreached` on first render (so pre-existing
 * breaches don't animate) and updates it every render.
 */
export function newlyBreachedIds(
  previouslyBreached: Set<string>,
  currentBreachedIds: string[],
): string[] {
  return currentBreachedIds.filter((id) => !previouslyBreached.has(id))
}
