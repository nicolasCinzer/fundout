import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  keyFor,
  readSession,
  writeSession,
  clearSession,
} from "./session-store"
import type { TradingDay } from "../types"

// ---------------------------------------------------------------------------
// Mock localStorage for Node environment (vitest runs in node)
// ---------------------------------------------------------------------------
const store: Record<string, string> = {}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k])
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
  })
})

// ---------------------------------------------------------------------------
// Key scheme — lifecycle-aware (C2b)
// ---------------------------------------------------------------------------
describe("keyFor", () => {
  it("includes lifecycle key to isolate attempts", () => {
    // key = fundout:backtest-session:v1:{backtestId}:{lifecycleKey}:{phase}
    expect(keyFor("abc123", "eval-event-id-1", "eval")).toBe(
      "fundout:backtest-session:v1:abc123:eval-event-id-1:eval",
    )
  })

  it("returns distinct keys for eval vs funded within the same lifecycle", () => {
    const evalKey = keyFor("abc123", "lc1", "eval")
    const fundedKey = keyFor("abc123", "lc1", "funded")
    expect(evalKey).not.toBe(fundedKey)
  })

  it("returns distinct keys for different lifecycle attempts (new eval)", () => {
    const attempt1 = keyFor("abc123", "eval-event-1", "eval")
    const attempt2 = keyFor("abc123", "eval-event-2", "eval")
    expect(attempt1).not.toBe(attempt2)
  })
})

// ---------------------------------------------------------------------------
// Round-trip
// ---------------------------------------------------------------------------
describe("writeSession / readSession", () => {
  it("round-trips a list of trading days", () => {
    const days: TradingDay[] = [
      { id: "d1", date: "2024-01-01", trades: [{ id: "t1", pnl: 500 }] },
      { id: "d2", trades: [{ id: "t2", pnl: -200 }, { id: "t3", pnl: 300 }] },
    ]
    writeSession("bt1", "lc1", "eval", days)
    const result = readSession("bt1", "lc1", "eval")
    expect(result).toEqual(days)
  })

  it("returns empty array when no session exists", () => {
    expect(readSession("nonexistent", "lc1", "eval")).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Zod rejection — corrupt / stale data
// ---------------------------------------------------------------------------
describe("readSession — corrupt / version guard", () => {
  it("returns empty array for corrupt JSON (LS-3)", () => {
    store[keyFor("bt1", "lc1", "eval")] = "{ this is not json }"
    expect(readSession("bt1", "lc1", "eval")).toEqual([])
  })

  it("returns empty array for schema_version !== 1 (LS-2)", () => {
    store[keyFor("bt1", "lc1", "eval")] = JSON.stringify({
      schemaVersion: 99,
      backtestId: "bt1",
      phase: "eval",
      days: [],
    })
    expect(readSession("bt1", "lc1", "eval")).toEqual([])
  })

  it("returns empty array when phase in payload mismatches requested phase (LS-7)", () => {
    store[keyFor("bt1", "lc1", "eval")] = JSON.stringify({
      schemaVersion: 1,
      backtestId: "bt1",
      phase: "funded", // mismatch!
      days: [],
    })
    expect(readSession("bt1", "lc1", "eval")).toEqual([])
  })

  it("returns empty array for missing required fields", () => {
    store[keyFor("bt1", "lc1", "eval")] = JSON.stringify({ days: [] })
    expect(readSession("bt1", "lc1", "eval")).toEqual([])
  })

  it("returns empty array for a trade missing pnl", () => {
    store[keyFor("bt1", "lc1", "eval")] = JSON.stringify({
      schemaVersion: 1,
      backtestId: "bt1",
      phase: "eval",
      days: [{ id: "d1", trades: [{ id: "t1" }] }], // pnl missing
    })
    expect(readSession("bt1", "lc1", "eval")).toEqual([])
  })

  it("never throws on any corrupt input", () => {
    store[keyFor("bt1", "lc1", "eval")] = "null"
    expect(() => readSession("bt1", "lc1", "eval")).not.toThrow()

    store[keyFor("bt1", "lc1", "eval")] = ""
    expect(() => readSession("bt1", "lc1", "eval")).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// clearSession
// ---------------------------------------------------------------------------
describe("clearSession", () => {
  it("removes the stored data so readSession returns empty (LS-4)", () => {
    const days: TradingDay[] = [{ id: "d1", trades: [{ id: "t1", pnl: 100 }] }]
    writeSession("bt1", "lc1", "eval", days)
    clearSession("bt1", "lc1", "eval")
    expect(readSession("bt1", "lc1", "eval")).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Eval vs funded isolation (same lifecycle)
// ---------------------------------------------------------------------------
describe("phase isolation", () => {
  it("eval and funded keys are isolated — writing eval does not affect funded (LS-5)", () => {
    const evalDays: TradingDay[] = [{ id: "d1", trades: [{ id: "t1", pnl: 100 }] }]
    writeSession("bt1", "lc1", "eval", evalDays)
    expect(readSession("bt1", "lc1", "funded")).toEqual([])
  })

  it("funded can be written and read independently", () => {
    const fundedDays: TradingDay[] = [{ id: "d2", trades: [{ id: "t2", pnl: 200 }] }]
    writeSession("bt1", "lc1", "funded", fundedDays)
    expect(readSession("bt1", "lc1", "funded")).toEqual(fundedDays)
    expect(readSession("bt1", "lc1", "eval")).toEqual([])
  })

  it("clearing eval does not clear funded", () => {
    const fundedDays: TradingDay[] = [{ id: "d2", trades: [] }]
    writeSession("bt1", "lc1", "funded", fundedDays)
    writeSession("bt1", "lc1", "eval", [{ id: "d1", trades: [] }])
    clearSession("bt1", "lc1", "eval")
    expect(readSession("bt1", "lc1", "funded")).toEqual(fundedDays)
  })
})

// ---------------------------------------------------------------------------
// Lifecycle isolation — different attempts are separate stores
// ---------------------------------------------------------------------------
describe("lifecycle isolation (C2b)", () => {
  it("different lifecycle keys produce isolated stores", () => {
    const days1: TradingDay[] = [{ id: "d1", trades: [{ id: "t1", pnl: 500 }] }]
    writeSession("bt1", "eval-event-1", "eval", days1)
    // Second eval attempt — completely empty
    expect(readSession("bt1", "eval-event-2", "eval")).toEqual([])
  })

  it("writing new eval does not affect previous eval lifecycle data", () => {
    const days1: TradingDay[] = [{ id: "d1", trades: [{ id: "t1", pnl: 500 }] }]
    writeSession("bt1", "eval-event-1", "eval", days1)
    const days2: TradingDay[] = [{ id: "d2", trades: [{ id: "t2", pnl: 100 }] }]
    writeSession("bt1", "eval-event-2", "eval", days2)
    // Old lifecycle still readable
    expect(readSession("bt1", "eval-event-1", "eval")).toEqual(days1)
    // New lifecycle has its own data
    expect(readSession("bt1", "eval-event-2", "eval")).toEqual(days2)
  })

  it("funded phase is keyed per lifecycle attempt", () => {
    const fundedDays: TradingDay[] = [{ id: "fd1", trades: [{ id: "ft1", pnl: 300 }] }]
    writeSession("bt1", "eval-event-1", "funded", fundedDays)
    // A different eval attempt has no funded session
    expect(readSession("bt1", "eval-event-2", "funded")).toEqual([])
  })
})
