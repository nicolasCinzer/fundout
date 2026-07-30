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
