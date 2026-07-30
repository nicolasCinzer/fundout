import { describe, it, expect, beforeEach } from "vitest"
import { groupLifecycles } from "./group-lifecycles"
import type { BacktestEvent } from "../types"

let _pos = 0

function makeEventWithLcId(
  type: "E" | "F" | "P",
  lifecycleId: string | null,
  amount?: number,
): BacktestEvent {
  _pos++
  return {
    id: `ev-${_pos}`,
    backtest_id: "bt-1",
    user_id: "user-1",
    position: _pos,
    type,
    amount: amount ?? (type === "P" ? 100 : null),
    notes: null,
    lifecycle_id: lifecycleId,
    created_at: new Date().toISOString(),
  }
}

/**
 * Build a flat event array simulating post-backfill data:
 * each "E" opens a new lifecycle (numbered lc-1, lc-2, ...);
 * subsequent "F" and "P" inherit the most recent "E"'s lifecycle_id.
 * This mirrors EXACTLY what the SQL CTE backfill produces.
 *
 * For multi-account tests with explicit lifecycle ids, use `eventsWithIds()`.
 */
function events(...types: Array<"E" | "F" | "P">): BacktestEvent[] {
  _pos = 0
  let currentLcId: string | null = null
  let lcCounter = 0
  return types.map((type) => {
    if (type === "E") {
      lcCounter++
      currentLcId = `lc-${lcCounter}`
    }
    return makeEventWithLcId(type, currentLcId)
  })
}

/**
 * Build events with explicit per-event lifecycle_id (for multi-account tests).
 * Pass pairs of [type, lifecycleId] or just a string lifecycleId to reuse
 * the same id.
 */
function makeEv(
  type: "E" | "F" | "P",
  lcId: string,
  amount?: number,
): BacktestEvent {
  return makeEventWithLcId(type, lcId, amount)
}

describe("groupLifecycles", () => {
  it("returns [] for empty event log", () => {
    expect(groupLifecycles([])).toEqual([])
  })

  it("[E] → 1 lifecycle, status=open", () => {
    const lcs = groupLifecycles(events("E"))
    expect(lcs).toHaveLength(1)
    expect(lcs[0].status).toBe("open")
    expect(lcs[0].fundedEvent).toBeNull()
    expect(lcs[0].payouts).toHaveLength(0)
    expect(lcs[0].index).toBe(1)
  })

  it("[E, F] → 1 lifecycle, status=funded_active (funded, no payout yet)", () => {
    const lcs = groupLifecycles(events("E", "F"))
    expect(lcs).toHaveLength(1)
    expect(lcs[0].status).toBe("funded_active")
    expect(lcs[0].fundedEvent).not.toBeNull()
    expect(lcs[0].payouts).toHaveLength(0)
  })

  it("[E, F, P] → 1 lifecycle, status=funded_paid (open, funded, with payout)", () => {
    const lcs = groupLifecycles(events("E", "F", "P"))
    expect(lcs).toHaveLength(1)
    expect(lcs[0].status).toBe("funded_paid")
    expect(lcs[0].fundedEvent).not.toBeNull()
    expect(lcs[0].payouts).toHaveLength(1)
    expect(lcs[0].payoutsTotal).toBe(100)
  })

  it("[E, F, P, E] → 2 lifecycles; first=funded_paid, second=open", () => {
    const lcs = groupLifecycles(events("E", "F", "P", "E"))
    expect(lcs).toHaveLength(2)
    expect(lcs[0].status).toBe("funded_paid")
    expect(lcs[1].status).toBe("open")
  })

  it("[E, E] → 2 lifecycles; both structural status=open (no breach info yet)", () => {
    // NOTE: With multi-account, groupLifecycles returns structural status only.
    // Terminal status (lost, breached_no_payout) is computed in compute-lifecycle-status.ts.
    const lcs = groupLifecycles(events("E", "E"))
    expect(lcs).toHaveLength(2)
    expect(lcs[0].status).toBe("open")
    expect(lcs[1].status).toBe("open")
  })

  it("[E, F, E] → 2 lifecycles; first=funded_active (structural), second=open", () => {
    // Terminal status (breached_no_payout) requires breach info from localStorage.
    const lcs = groupLifecycles(events("E", "F", "E"))
    expect(lcs).toHaveLength(2)
    expect(lcs[0].status).toBe("funded_active")
    expect(lcs[0].fundedEvent).not.toBeNull()
    expect(lcs[0].payouts).toHaveLength(0)
    expect(lcs[1].status).toBe("open")
  })

  it("defensive: stray F with no preceding E (null lifecycle_id) is ignored", () => {
    _pos = 0
    const evs: BacktestEvent[] = [
      makeEventWithLcId("F", null),  // stray: no lifecycle_id → ignored
      makeEventWithLcId("E", "lc-1"),
    ]
    const lcs = groupLifecycles(evs)
    // stray F ignored; only E opens a lifecycle
    expect(lcs).toHaveLength(1)
    expect(lcs[0].status).toBe("open")
  })

  it("Amendment 1 (Peor Racha streak input): [E,E,F,P,E,F,E,E] → 5 lifecycles (structural statuses)", () => {
    // With multi-account rewrite: groupLifecycles returns STRUCTURAL status only.
    // Terminal classification (lost, breached_no_payout) is in compute-lifecycle-status.ts.
    // LC1: E1 only → structural=open
    // LC2: E2+F+P → structural=funded_paid
    // LC3: E5+F → structural=funded_active
    // LC4: E7 only → structural=open
    // LC5: E8 only → structural=open
    const lcs = groupLifecycles(events("E", "E", "F", "P", "E", "F", "E", "E"))
    expect(lcs).toHaveLength(5)
    expect(lcs[0].status).toBe("open")        // was: lost
    expect(lcs[1].status).toBe("funded_paid")
    expect(lcs[2].status).toBe("funded_active") // was: breached_no_payout
    expect(lcs[3].status).toBe("open")         // was: lost
    expect(lcs[4].status).toBe("open")
  })

  it("indexes are 1-based and sequential", () => {
    const lcs = groupLifecycles(events("E", "E", "E"))
    expect(lcs.map((lc) => lc.index)).toEqual([1, 2, 3])
  })

  it("startPosition reflects the E event's position", () => {
    const lcs = groupLifecycles(events("E", "E"))
    expect(lcs[0].startPosition).toBe(1)
    expect(lcs[1].startPosition).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// COMMIT 3 — Multi-account tests (group-by-lifecycle_id)
// These tests FAIL before the groupLifecycles rewrite and pass after.
// ---------------------------------------------------------------------------

describe("groupLifecycles — multi-account (group by lifecycle_id)", () => {
  beforeEach(() => {
    _pos = 0
  })

  it("MA-GL-1: two concurrent open lifecycles — both status=open", () => {
    // [E(lc-A), E(lc-B)] — two separate accounts started
    const evs: BacktestEvent[] = [
      makeEv("E", "lc-A"),
      makeEv("E", "lc-B"),
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(2)
    expect(lcs.find(lc => lc.evalEvent.lifecycle_id === "lc-A")?.status).toBe("open")
    expect(lcs.find(lc => lc.evalEvent.lifecycle_id === "lc-B")?.status).toBe("open")
  })

  it("MA-GL-2: one funded, one open — independent statuses", () => {
    // [E(A), F(A), E(B)] — A funded, B open, interleaved
    const evs: BacktestEvent[] = [
      makeEv("E", "lc-A"),
      makeEv("F", "lc-A"),
      makeEv("E", "lc-B"),
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(2)
    const a = lcs.find(lc => lc.evalEvent.lifecycle_id === "lc-A")!
    const b = lcs.find(lc => lc.evalEvent.lifecycle_id === "lc-B")!
    expect(a.status).toBe("funded_active")
    expect(b.status).toBe("open")
  })

  it("MA-GL-3: Paid lifecycle — payout does not close it", () => {
    const evs: BacktestEvent[] = [
      makeEv("E", "lc-A"),
      makeEv("F", "lc-A"),
      makeEv("P", "lc-A", 500),
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(1)
    expect(lcs[0].status).toBe("funded_paid")
    expect(lcs[0].payoutsTotal).toBe(500)
  })

  it("MA-GL-4: interleaved events across two lifecycles — each groups correctly", () => {
    // E(A), E(B), F(A), P(A), F(B) — interleaved
    const evs: BacktestEvent[] = [
      makeEv("E", "lc-A"),
      makeEv("E", "lc-B"),
      makeEv("F", "lc-A"),
      makeEv("P", "lc-A", 300),
      makeEv("F", "lc-B"),
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(2)
    const a = lcs.find(lc => lc.evalEvent.lifecycle_id === "lc-A")!
    const b = lcs.find(lc => lc.evalEvent.lifecycle_id === "lc-B")!
    expect(a.status).toBe("funded_paid")
    expect(a.payoutsTotal).toBe(300)
    expect(b.status).toBe("funded_active")
  })

  it("MA-GL-5: 3 concurrent open lifecycles all return status=open", () => {
    const evs: BacktestEvent[] = [
      makeEv("E", "lc-A"),
      makeEv("E", "lc-B"),
      makeEv("E", "lc-C"),
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(3)
    expect(lcs.every(lc => lc.status === "open")).toBe(true)
  })

  it("MA-GL-6: events with null lifecycle_id are ignored (stray/legacy guard)", () => {
    const evs: BacktestEvent[] = [
      makeEventWithLcId("E", "lc-A"),
      makeEventWithLcId("F", null),  // null → ignored
      makeEventWithLcId("P", null, 100),  // null → ignored
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(1)
    // F/P with null lifecycle_id were ignored → lc-A remains open
    expect(lcs[0].status).toBe("open")
    expect(lcs[0].fundedEvent).toBeNull()
  })

  it("MA-GL-7: ordering by startPosition ASC (creation order)", () => {
    // lc-B has lower startPosition than lc-A due to interleaving with higher positions
    // But lc-A's E is at position 1, lc-B's E is at position 2 → A first
    const evs: BacktestEvent[] = [
      makeEv("E", "lc-A"),   // position 1
      makeEv("E", "lc-B"),   // position 2
      makeEv("F", "lc-B"),
      makeEv("F", "lc-A"),
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(2)
    // A was created first (lower startPosition) → index=1
    expect(lcs[0].evalEvent.lifecycle_id).toBe("lc-A")
    expect(lcs[0].index).toBe(1)
    expect(lcs[1].evalEvent.lifecycle_id).toBe("lc-B")
    expect(lcs[1].index).toBe(2)
  })

  it("MA-GL-8: first-F-wins for funded event within a lifecycle", () => {
    const evs: BacktestEvent[] = [
      makeEv("E", "lc-A"),
      makeEv("F", "lc-A"),
      makeEv("F", "lc-A"),  // second F — ignored (first-F-wins)
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(1)
    expect(lcs[0].fundedEvent?.id).toBe("ev-2")  // first F
  })

  it("MA-GL-9: stray P (no funded event for lifecycle) is ignored", () => {
    const evs: BacktestEvent[] = [
      makeEv("E", "lc-A"),
      makeEv("P", "lc-A", 200),  // P with no F → ignored
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(1)
    expect(lcs[0].status).toBe("open")
    expect(lcs[0].payouts).toHaveLength(0)
  })

  it("MA-GL-7 (spec SCENARIO): legacy backfilled rows — positional groups preserved", () => {
    // [E(lc=X), F(lc=X), E(lc=Y)] → LC X funded, LC Y open
    const evs: BacktestEvent[] = [
      makeEv("E", "lc-X"),
      makeEv("F", "lc-X"),
      makeEv("E", "lc-Y"),
    ]
    const lcs = groupLifecycles(evs)
    expect(lcs).toHaveLength(2)
    const x = lcs.find(lc => lc.evalEvent.lifecycle_id === "lc-X")!
    const y = lcs.find(lc => lc.evalEvent.lifecycle_id === "lc-Y")!
    expect(x.status).toBe("funded_active")
    expect(y.status).toBe("open")
  })
})
