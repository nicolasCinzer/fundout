import type { BacktestEvent, Lifecycle, LifecycleStatus } from "../types"

type MutableLifecycle = {
  startPosition: number
  evalEvent: BacktestEvent
  fundedEvent: BacktestEvent | null
  payouts: BacktestEvent[]
  payoutsTotal: number
}

/**
 * Derive STRUCTURAL status only (no breach awareness — caller combines with
 * computeLifecycleStatus for terminal classification).
 *
 * Structural rules:
 *  - E only                    → open
 *  - E + F, no P               → funded_active
 *  - E + F + >=1 P             → funded_paid
 *
 * Terminal statuses (lost, breached_no_payout) are NOT returned here;
 * they require breach information from localStorage (see compute-lifecycle-status.ts).
 * However, to preserve backward compatibility with single-lifecycle callers that
 * rely on the positional "closed by next E" signals, we still handle those cases:
 * since all events now carry a lifecycle_id, a lifecycle that has no F and is NOT
 * the last lifecycle in the log is simply returned as "lost", and funded-but-no-P
 * closed lifecycles are "breached_no_payout".
 *
 * Post-multi-account: ALL lifecycles can be open simultaneously, so the
 * "closed by next E" rule is REMOVED. Status is structural only.
 */
function deriveStatus(lc: MutableLifecycle): LifecycleStatus {
  if (lc.fundedEvent !== null && lc.payouts.length > 0) return "funded_paid"
  if (lc.fundedEvent !== null) return "funded_active"
  return "open"
}

/**
 * Groups backtest_events by lifecycle_id.
 *
 * New algorithm (multi-account — ADR-2):
 * - Iterate events sorted by position ASC (caller must ensure this order).
 * - Group by lifecycle_id. Events with null lifecycle_id are ignored (stray/legacy).
 * - E with a lifecycle_id → create or reuse a lifecycle entry; record startPosition
 *   from first E seen for that id (first-E anchors the lifecycle).
 * - F with lifecycle_id in map AND no fundedEvent yet → set fundedEvent (first-F-wins).
 * - P with lifecycle_id in map AND fundedEvent set → push payout, accumulate total.
 * - Stray F/P (null lifecycle_id, unknown lifecycle_id, or P without F) → ignore.
 *
 * Ordering:
 * - After grouping, sort by startPosition ASC → assign index = i + 1 (1-based).
 * - This gives stable "account 1, 2, 3..." numbering matching creation order.
 *
 * Status returned is STRUCTURAL only (open | funded_active | funded_paid).
 * The caller is responsible for combining with breach information to get terminal status.
 *
 * Satisfies: REQ-MA-GL-01..04, ADR-2.
 */
export function groupLifecycles(events: BacktestEvent[]): Lifecycle[] {
  const map = new Map<string, MutableLifecycle>()

  for (const ev of events) {
    const lcId = ev.lifecycle_id
    if (lcId === null) continue // null lifecycle_id → ignore

    if (ev.type === "E") {
      if (!map.has(lcId)) {
        // Create a new lifecycle entry
        map.set(lcId, {
          startPosition: ev.position,
          evalEvent: ev,
          fundedEvent: null,
          payouts: [],
          payoutsTotal: 0,
        })
      }
      // If already in map: first-E-wins (defensive, shouldn't happen with correct data)
    } else if (ev.type === "F") {
      const lc = map.get(lcId)
      if (lc && lc.fundedEvent === null) {
        lc.fundedEvent = ev // first-F-wins
      }
      // Else: no matching lifecycle or already funded → ignore
    } else if (ev.type === "P") {
      const lc = map.get(lcId)
      if (lc && lc.fundedEvent !== null) {
        lc.payouts.push(ev)
        lc.payoutsTotal += Number(ev.amount ?? 0)
      }
      // Else: P without funded lifecycle → ignore
    }
  }

  // Sort by startPosition ASC (creation order), assign 1-based index
  const sorted = Array.from(map.values()).sort(
    (a, b) => a.startPosition - b.startPosition,
  )

  return sorted.map((lc, i) => ({
    index: i + 1,
    startPosition: lc.startPosition,
    evalEvent: lc.evalEvent,
    fundedEvent: lc.fundedEvent,
    payouts: lc.payouts,
    payoutsTotal: lc.payoutsTotal,
    status: deriveStatus(lc),
  }))
}
