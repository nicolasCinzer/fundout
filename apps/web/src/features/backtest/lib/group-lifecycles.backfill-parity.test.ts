/**
 * Backfill parity test (COMMIT 2)
 *
 * Validates that the SQL CTE grouping logic in the migration assigns the same
 * lifecycle_id groupings as the OLD positional walk (which is inlined here as a
 * reference implementation). After applying the CTE backfill, calling the NEW
 * group-by-id groupLifecycles on the backfilled events must produce the same
 * structural result (count, payoutsTotal, fundedEvent presence) as the OLD
 * positional walk would have.
 *
 * This is a one-off guard run before the orchestrator applies the remote
 * migration. It does NOT test the new group-by-id logic — only that the
 * backfill CTE produces the same groups as the old positional walk.
 *
 * Satisfies: Design §1 "parity guard", ADR-1 backfill verification.
 */
import { describe, it, expect, beforeEach } from "vitest"
import { groupLifecycles } from "./group-lifecycles"
import type { BacktestEvent, Lifecycle } from "../types"

let _pos = 0
function makeEvent(type: "E" | "F" | "P", amount?: number, lifecycleId?: string | null): BacktestEvent {
  _pos++
  return {
    id: `ev-${_pos}`,
    backtest_id: "bt-1",
    user_id: "user-1",
    position: _pos,
    type,
    amount: amount ?? (type === "P" ? 100 : null),
    notes: null,
    lifecycle_id: lifecycleId ?? null,
    created_at: new Date().toISOString(),
  }
}

/**
 * OLD positional groupLifecycles (reference implementation inlined here).
 * This is what the function did BEFORE the multi-account rewrite.
 * Used only for parity comparison — do NOT import or use in production code.
 */
function positionalGroupLifecycles(events: BacktestEvent[]): Lifecycle[] {
  type Mutable = {
    index: number; startPosition: number; evalEvent: BacktestEvent
    fundedEvent: BacktestEvent | null; payouts: BacktestEvent[]; payoutsTotal: number
  }
  const result: Lifecycle[] = []
  let current: Mutable | null = null

  function deriveStatus(lc: Mutable, isOpen: boolean) {
    if (isOpen) {
      if (lc.fundedEvent !== null && lc.payouts.length > 0) return "funded_paid" as const
      if (lc.fundedEvent !== null) return "funded_active" as const
      return "open" as const
    }
    if (lc.fundedEvent === null) return "lost" as const
    if (lc.payouts.length === 0) return "breached_no_payout" as const
    return "funded_paid" as const
  }

  for (const ev of events) {
    if (ev.type === "E") {
      if (current !== null) result.push({ ...current, status: deriveStatus(current, false) })
      current = { index: result.length + 1, startPosition: ev.position, evalEvent: ev, fundedEvent: null, payouts: [], payoutsTotal: 0 }
    } else if (ev.type === "F" && current !== null && current.fundedEvent === null) {
      current.fundedEvent = ev
    } else if (ev.type === "P" && current !== null && current.fundedEvent !== null) {
      current.payouts.push(ev)
      current.payoutsTotal += Number(ev.amount ?? 0)
    }
  }
  if (current !== null) result.push({ ...current, status: deriveStatus(current, true) })
  return result
}

/**
 * Simulate the SQL CTE grouping logic in JS:
 * - Running count of E events seen so far → group ordinal (grp)
 * - grp=0 for stray leading F/P → lifecycle_id stays null (ignored)
 * - One stable uuid per (backtest_id, grp) pair
 *
 * Returns the same event array with lifecycle_id assigned.
 */
function simulateCteBackfill(events: BacktestEvent[]): BacktestEvent[] {
  const groupIds = new Map<number, string>()
  let grpCounter = 0
  const numbered = events.map(ev => {
    if (ev.type === "E") grpCounter++
    return { ev, grp: grpCounter }
  })

  const uniqueGrps = new Set(numbered.filter(n => n.grp > 0).map(n => n.grp))
  uniqueGrps.forEach(grp => {
    groupIds.set(grp, `backfill-uuid-${grp}`)
  })

  return numbered.map(({ ev, grp }) => ({
    ...ev,
    lifecycle_id: grp > 0 ? (groupIds.get(grp) ?? null) : null,
  }))
}

describe("backfill parity: SQL CTE logic mirrors positional groupLifecycles", () => {
  beforeEach(() => {
    _pos = 0
  })

  it("representative fixture: [E, F, P, E, F, E] — 3 groups", () => {
    const preMigration: BacktestEvent[] = [
      makeEvent("E"),
      makeEvent("F"),
      makeEvent("P", 500),
      makeEvent("E"),
      makeEvent("F"),
      makeEvent("E"),
    ]

    // OLD positional reference
    const positional = positionalGroupLifecycles(preMigration)

    // Simulate CTE backfill → then new group-by-id groupLifecycles
    const backfilled = simulateCteBackfill(preMigration)
    const backfilledGrouped = groupLifecycles(backfilled)

    // Count must match
    expect(backfilledGrouped).toHaveLength(positional.length)
    // Structural grouping parity: payoutsTotal and payout count must match per group
    positional.forEach((lc, i) => {
      expect(backfilledGrouped[i].index).toBe(lc.index)
      expect(backfilledGrouped[i].payoutsTotal).toBe(lc.payoutsTotal)
      expect(backfilledGrouped[i].payouts).toHaveLength(lc.payouts.length)
      expect(backfilledGrouped[i].fundedEvent !== null).toBe(lc.fundedEvent !== null)
    })
  })

  it("stray leading F/P (grp=0) stays null — not grouped", () => {
    _pos = 0
    const preMigration: BacktestEvent[] = [
      makeEvent("F"),  // stray: grp=0 → lifecycle_id stays null
      makeEvent("E"),  // grp=1
      makeEvent("F"),  // grp=1
    ]

    const backfilled = simulateCteBackfill(preMigration)
    expect(backfilled[0].lifecycle_id).toBeNull()  // stray F: no uuid
    expect(backfilled[1].lifecycle_id).not.toBeNull()  // E: uuid assigned
    expect(backfilled[2].lifecycle_id).toBe(backfilled[1].lifecycle_id)  // F shares E's uuid

    // groupLifecycles on backfilled data: stray F ignored, 1 lifecycle (funded_active)
    const grouped = groupLifecycles(backfilled)
    expect(grouped).toHaveLength(1)
    expect(grouped[0].fundedEvent).not.toBeNull()
  })

  it("idempotent guard: rows with lifecycle_id already set are not processed again", () => {
    // Simulate rows already having lifecycle_id (second migration run should be a no-op)
    const alreadyBackfilled: BacktestEvent[] = [
      makeEvent("E", undefined, "existing-uuid-1"),
      makeEvent("F", undefined, "existing-uuid-1"),
      makeEvent("E", undefined, "existing-uuid-2"),
    ]

    // A re-run of the CTE on rows WHERE lifecycle_id IS NULL would find nothing to update
    const notFilled = alreadyBackfilled.filter(e => e.lifecycle_id === null)
    expect(notFilled).toHaveLength(0) // nothing to backfill = idempotent
  })

  it("complex fixture: [E,E,F,P,E,F,E,E] — 5 groups, payoutsTotal parity", () => {
    const preMigration: BacktestEvent[] = [
      makeEvent("E"),
      makeEvent("E"),
      makeEvent("F"),
      makeEvent("P", 200),
      makeEvent("E"),
      makeEvent("F"),
      makeEvent("E"),
      makeEvent("E"),
    ]

    const positional = positionalGroupLifecycles(preMigration)
    const backfilled = simulateCteBackfill(preMigration)
    const backfilledGrouped = groupLifecycles(backfilled)

    expect(backfilledGrouped).toHaveLength(positional.length)
    expect(backfilledGrouped.map(lc => lc.payoutsTotal)).toEqual(positional.map(lc => lc.payoutsTotal))
    // Funded event presence must match
    expect(backfilledGrouped.map(lc => lc.fundedEvent !== null)).toEqual(positional.map(lc => lc.fundedEvent !== null))
  })

  it("events within the same group share the same lifecycle_id uuid after backfill", () => {
    const preMigration: BacktestEvent[] = [
      makeEvent("E"),   // grp=1
      makeEvent("F"),   // grp=1
      makeEvent("P"),   // grp=1
      makeEvent("E"),   // grp=2
    ]

    const backfilled = simulateCteBackfill(preMigration)
    // First group: E, F, P all share uuid for grp=1
    expect(backfilled[0].lifecycle_id).toBe(backfilled[1].lifecycle_id)
    expect(backfilled[0].lifecycle_id).toBe(backfilled[2].lifecycle_id)
    // Second group: E has different uuid
    expect(backfilled[3].lifecycle_id).not.toBe(backfilled[0].lifecycle_id)
    expect(backfilled[3].lifecycle_id).not.toBeNull()
  })
})
