import type { BacktestEvent, Lifecycle, LifecycleStatus } from "../types"

type MutableLifecycle = {
  index: number
  startPosition: number
  evalEvent: BacktestEvent
  fundedEvent: BacktestEvent | null
  payouts: BacktestEvent[]
  payoutsTotal: number
  // status computed at close/finalize time
}

function deriveStatus(lc: MutableLifecycle, isOpen: boolean): LifecycleStatus {
  if (isOpen) {
    // Last lifecycle — not yet closed by another E
    if (lc.fundedEvent !== null && lc.payouts.length > 0) return "funded_paid"
    if (lc.fundedEvent !== null) return "funded_active" // F but no P yet
    return "open" // only E, not yet funded
  }
  // Closed lifecycle (another E arrived after this one)
  if (lc.fundedEvent === null) return "lost"
  if (lc.payouts.length === 0) return "breached_no_payout"
  return "funded_paid"
}

/**
 * Pure function. O(n) walk of events (sorted by position ASC).
 * Each E event opens a new lifecycle. The lifecycle absorbs the next F
 * (if any, first F only) and all P events until the next E.
 *
 * Stray F/P with no preceding E are silently ignored (defensive).
 *
 * Returns lifecycles in chronological order (1-indexed).
 */
export function groupLifecycles(events: BacktestEvent[]): Lifecycle[] {
  const lifecycles: Lifecycle[] = []
  let current: MutableLifecycle | null = null

  for (const ev of events) {
    if (ev.type === "E") {
      if (current !== null) {
        // Close the current lifecycle
        lifecycles.push({
          ...current,
          status: deriveStatus(current, false),
        })
      }
      current = {
        index: lifecycles.length + 1,
        startPosition: ev.position,
        evalEvent: ev,
        fundedEvent: null,
        payouts: [],
        payoutsTotal: 0,
      }
    } else if (ev.type === "F" && current !== null && current.fundedEvent === null) {
      // First F in this lifecycle
      current.fundedEvent = ev
    } else if (ev.type === "P" && current !== null && current.fundedEvent !== null) {
      // Payouts only count if lifecycle is funded
      current.payouts.push(ev)
      current.payoutsTotal += Number(ev.amount ?? 0)
    }
    // else: stray F/P — ignore
  }

  if (current !== null) {
    // Finalize the last (open) lifecycle
    lifecycles.push({
      ...current,
      status: deriveStatus(current, true),
    })
  }

  return lifecycles
}
