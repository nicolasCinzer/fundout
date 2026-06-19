import { describe, it, expect } from "vitest"
import { nextAllowedEvent } from "./next-allowed-event"
import type { BacktestEvent } from "../types"

function makeEvent(type: "E" | "F" | "P", position = 1): BacktestEvent {
  return {
    id: "test-id",
    backtest_id: "bt-1",
    user_id: "user-1",
    position,
    type,
    amount: type === "P" ? 100 : null,
    notes: null,
    created_at: new Date().toISOString(),
  }
}

describe("nextAllowedEvent", () => {
  it("returns [E] when log is empty (null)", () => {
    expect(nextAllowedEvent(null)).toEqual(["E"])
  })

  it("returns [E, F] after an E event", () => {
    expect(nextAllowedEvent(makeEvent("E"))).toEqual(["E", "F"])
  })

  it("returns [E, P] after an F event", () => {
    expect(nextAllowedEvent(makeEvent("F"))).toEqual(["E", "P"])
  })

  it("returns [E, P] after a P event", () => {
    expect(nextAllowedEvent(makeEvent("P"))).toEqual(["E", "P"])
  })
})
