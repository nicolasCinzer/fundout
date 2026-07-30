import { describe, it, expect } from "vitest"
import { nextAllowedEvent, lastEventOfLifecycle } from "./next-allowed-event"
import type { BacktestEvent } from "../types"

let _pos = 0
function makeEvent(
  type: "E" | "F" | "P",
  lifecycleId: string | null = null,
): BacktestEvent {
  _pos++
  return {
    id: `ev-${_pos}`,
    backtest_id: "bt-1",
    user_id: "user-1",
    position: _pos,
    type,
    amount: type === "P" ? 100 : null,
    notes: null,
    lifecycle_id: lifecycleId,
    created_at: new Date().toISOString(),
  }
}

describe("nextAllowedEvent", () => {
  it("returns [E] when log is empty (null)", () => {
    expect(nextAllowedEvent(null)).toEqual(["E"])
  })

  it("returns [E, F] after an E event", () => {
    _pos = 0
    expect(nextAllowedEvent(makeEvent("E"))).toEqual(["E", "F"])
  })

  it("returns [E, P] after an F event", () => {
    _pos = 0
    expect(nextAllowedEvent(makeEvent("F"))).toEqual(["E", "P"])
  })

  it("returns [E, P] after a P event", () => {
    _pos = 0
    expect(nextAllowedEvent(makeEvent("P"))).toEqual(["E", "P"])
  })
})

// ---------------------------------------------------------------------------
// COMMIT 5 — lastEventOfLifecycle helper (RED first, then GREEN)
// Satisfies: REQ-MA-NAE-01..04, ADR-4
// ---------------------------------------------------------------------------

describe("lastEventOfLifecycle", () => {
  it("returns the max-position event with the given lifecycle_id", () => {
    _pos = 0
    const evs: BacktestEvent[] = [
      makeEvent("E", "lc-A"),  // pos 1
      makeEvent("F", "lc-A"),  // pos 2 ← last for lc-A
    ]
    const last = lastEventOfLifecycle(evs, "lc-A")
    expect(last).not.toBeNull()
    expect(last?.type).toBe("F")
    expect(last?.position).toBe(2)
  })

  it("ignores events from other lifecycles", () => {
    _pos = 0
    const evs: BacktestEvent[] = [
      makeEvent("E", "lc-A"),  // pos 1
      makeEvent("E", "lc-B"),  // pos 2
      makeEvent("F", "lc-B"),  // pos 3 ← lc-B's last
      makeEvent("F", "lc-A"),  // pos 4 ← lc-A's last
    ]
    const lastA = lastEventOfLifecycle(evs, "lc-A")
    const lastB = lastEventOfLifecycle(evs, "lc-B")
    expect(lastA?.position).toBe(4)
    expect(lastB?.position).toBe(3)
  })

  it("returns null when no events match the lifecycle_id", () => {
    _pos = 0
    const evs: BacktestEvent[] = [makeEvent("E", "lc-A")]
    expect(lastEventOfLifecycle(evs, "lc-B")).toBeNull()
  })

  it("returns null for empty events array", () => {
    expect(lastEventOfLifecycle([], "lc-A")).toBeNull()
  })

  it("interleaved events across two lifecycles: each returns correct last", () => {
    _pos = 0
    const evs: BacktestEvent[] = [
      makeEvent("E", "lc-A"),  // pos 1
      makeEvent("E", "lc-B"),  // pos 2
      makeEvent("F", "lc-A"),  // pos 3
      makeEvent("P", "lc-A"),  // pos 4 ← lc-A last
      // lc-B's last is pos 2
    ]
    expect(lastEventOfLifecycle(evs, "lc-A")?.position).toBe(4)
    expect(lastEventOfLifecycle(evs, "lc-B")?.position).toBe(2)
  })
})
