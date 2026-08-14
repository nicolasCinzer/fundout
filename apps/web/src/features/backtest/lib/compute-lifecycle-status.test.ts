/**
 * compute-lifecycle-status tests (COMMIT 4 — RED first, then GREEN)
 * Satisfies: REQ-MA-STATUS-01..04, ADR-3, SCENARIO MA-GL-4..6
 */
import { describe, it, expect } from "vitest"
import {
  deriveLifecycleStatus,
  isLifecycleLive,
  nextSelectionAfterBreach,
  newlyBreachedIds,
  BREACH_ANIM_MS,
} from "./compute-lifecycle-status"
import type { Lifecycle } from "../types"

function makeLc(
  overrides: Partial<Lifecycle> & Pick<Lifecycle, "evalEvent">,
): Lifecycle {
  return {
    index: 1,
    startPosition: 1,
    fundedEvent: null,
    payouts: [],
    payoutsTotal: 0,
    status: "open",
    ...overrides,
  }
}

const evalEv = {
  id: "ev-e",
  backtest_id: "bt-1",
  user_id: "u-1",
  position: 1,
  type: "E" as const,
  amount: null,
  notes: null,
  lifecycle_id: "lc-A",
  created_at: new Date().toISOString(),
}

const fundedEv = {
  id: "ev-f",
  backtest_id: "bt-1",
  user_id: "u-1",
  position: 2,
  type: "F" as const,
  amount: null,
  notes: null,
  lifecycle_id: "lc-A",
  created_at: new Date().toISOString(),
}

const payoutEv = {
  id: "ev-p",
  backtest_id: "bt-1",
  user_id: "u-1",
  position: 3,
  type: "P" as const,
  amount: 500,
  notes: null,
  lifecycle_id: "lc-A",
  created_at: new Date().toISOString(),
}

describe("deriveLifecycleStatus", () => {
  // 6 status rows from ADR-3

  it("not breached + no F → open", () => {
    const lc = makeLc({ evalEvent: evalEv, status: "open" })
    expect(deriveLifecycleStatus(lc, false)).toBe("open")
  })

  it("not breached + F, 0 payouts → funded_active", () => {
    const lc = makeLc({ evalEvent: evalEv, fundedEvent: fundedEv, status: "funded_active" })
    expect(deriveLifecycleStatus(lc, false)).toBe("funded_active")
  })

  it("not breached + F, >=1 payout → funded_paid", () => {
    const lc = makeLc({
      evalEvent: evalEv,
      fundedEvent: fundedEv,
      payouts: [payoutEv],
      payoutsTotal: 500,
      status: "funded_paid",
    })
    expect(deriveLifecycleStatus(lc, false)).toBe("funded_paid")
  })

  it("breached + no F → lost", () => {
    const lc = makeLc({ evalEvent: evalEv, status: "open" })
    expect(deriveLifecycleStatus(lc, true)).toBe("lost")
  })

  it("breached + F, 0 payouts → breached_no_payout", () => {
    const lc = makeLc({ evalEvent: evalEv, fundedEvent: fundedEv, status: "funded_active" })
    expect(deriveLifecycleStatus(lc, true)).toBe("breached_no_payout")
  })

  it("breached + F, >=1 payout → funded_paid (Paid trumps later breach)", () => {
    const lc = makeLc({
      evalEvent: evalEv,
      fundedEvent: fundedEv,
      payouts: [payoutEv],
      payoutsTotal: 500,
      status: "funded_paid",
    })
    expect(deriveLifecycleStatus(lc, true)).toBe("funded_paid")
  })
})

describe("isLifecycleLive", () => {
  it("not breached → live", () => {
    expect(isLifecycleLive(false)).toBe(true)
  })

  it("breached → not live", () => {
    expect(isLifecycleLive(true)).toBe(false)
  })
})

describe("BREACH_ANIM_MS", () => {
  it("is 3000ms", () => {
    expect(BREACH_ANIM_MS).toBe(3000)
  })
})

describe("nextSelectionAfterBreach", () => {
  // The selection only moves when the BREACHED lifecycle was the SELECTED one.
  it("keeps current selection when a NON-selected lifecycle breaches", () => {
    expect(nextSelectionAfterBreach("lc-B", ["lc-A", "lc-C"], "lc-A")).toBe("lc-A")
  })

  it("jumps to the first live lifecycle when the selected one breaches", () => {
    expect(nextSelectionAfterBreach("lc-A", ["lc-B", "lc-C"], "lc-A")).toBe("lc-B")
  })

  it("excludes the breached id even if it lingers in the live list", () => {
    expect(nextSelectionAfterBreach("lc-A", ["lc-A", "lc-B"], "lc-A")).toBe("lc-B")
  })

  it("returns null when the selected one breaches and no live remain", () => {
    expect(nextSelectionAfterBreach("lc-A", [], "lc-A")).toBeNull()
    expect(nextSelectionAfterBreach("lc-A", ["lc-A"], "lc-A")).toBeNull()
  })

  it("keeps null selection untouched", () => {
    expect(nextSelectionAfterBreach("lc-A", ["lc-B"], null)).toBeNull()
  })
})

describe("newlyBreachedIds", () => {
  // Only ids that JUST crossed into breached (not already-breached) should animate.
  it("returns ids breached now but not previously", () => {
    const prev = new Set(["lc-A"])
    expect(newlyBreachedIds(prev, ["lc-A", "lc-B"])).toEqual(["lc-B"])
  })

  it("returns nothing when all currently-breached were already breached", () => {
    const prev = new Set(["lc-A", "lc-B"])
    expect(newlyBreachedIds(prev, ["lc-A", "lc-B"])).toEqual([])
  })

  it("returns all when previously-breached is empty EXCEPT nothing on first-seed use (caller seeds)", () => {
    expect(newlyBreachedIds(new Set(), ["lc-A", "lc-B"])).toEqual(["lc-A", "lc-B"])
  })

  it("ignores ids that recovered (breached before, not now)", () => {
    const prev = new Set(["lc-A"])
    expect(newlyBreachedIds(prev, [])).toEqual([])
  })
})
