import { describe, it, expect } from "vitest"
import { groupLifecycles } from "./group-lifecycles"
import type { BacktestEvent } from "../types"

let _pos = 0
function makeEvent(type: "E" | "F" | "P", amount?: number): BacktestEvent {
  _pos++
  return {
    id: `ev-${_pos}`,
    backtest_id: "bt-1",
    user_id: "user-1",
    position: _pos,
    type,
    amount: amount ?? (type === "P" ? 100 : null),
    notes: null,
    created_at: new Date().toISOString(),
  }
}

function events(...types: Array<"E" | "F" | "P">): BacktestEvent[] {
  _pos = 0
  return types.map((t) => makeEvent(t))
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

  it("[E, F] → 1 lifecycle, status=open (funded, no payout, still open)", () => {
    const lcs = groupLifecycles(events("E", "F"))
    expect(lcs).toHaveLength(1)
    expect(lcs[0].status).toBe("open")
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

  it("[E, F, P, E] → 2 lifecycles; first=funded_paid (closed), second=open", () => {
    const lcs = groupLifecycles(events("E", "F", "P", "E"))
    expect(lcs).toHaveLength(2)
    expect(lcs[0].status).toBe("funded_paid")
    expect(lcs[1].status).toBe("open")
  })

  it("[E, E] → 2 lifecycles; first=lost, second=open", () => {
    const lcs = groupLifecycles(events("E", "E"))
    expect(lcs).toHaveLength(2)
    expect(lcs[0].status).toBe("lost")
    expect(lcs[1].status).toBe("open")
  })

  it("[E, F, E] → 2 lifecycles; first=blown_no_payout, second=open", () => {
    const lcs = groupLifecycles(events("E", "F", "E"))
    expect(lcs).toHaveLength(2)
    expect(lcs[0].status).toBe("blown_no_payout")
    expect(lcs[0].fundedEvent).not.toBeNull()
    expect(lcs[0].payouts).toHaveLength(0)
    expect(lcs[1].status).toBe("open")
  })

  it("defensive: stray F with no preceding E is ignored", () => {
    _pos = 0
    const evs: BacktestEvent[] = [makeEvent("F"), makeEvent("E")]
    const lcs = groupLifecycles(evs)
    // stray F ignored; only E opens a lifecycle
    expect(lcs).toHaveLength(1)
    expect(lcs[0].status).toBe("open")
  })

  it("Amendment 1 (Peor Racha streak input): [E,E,F,P,E,F,E,E] → 5 lifecycles with correct statuses", () => {
    // LC1: E1 → closed by E2 → lost
    // LC2: E2+F+P → closed by E5 → funded_paid
    // LC3: E5+F → closed by E7 → blown_no_payout
    // LC4: E7 → closed by E8 → lost
    // LC5: E8 → end of log → open
    const lcs = groupLifecycles(events("E", "E", "F", "P", "E", "F", "E", "E"))
    expect(lcs).toHaveLength(5)
    expect(lcs[0].status).toBe("lost")
    expect(lcs[1].status).toBe("funded_paid")
    expect(lcs[2].status).toBe("blown_no_payout")
    expect(lcs[3].status).toBe("lost")
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
